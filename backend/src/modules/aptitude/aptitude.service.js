const mongoose = require('mongoose');
const AptitudeQuestion = require('../../models/AptitudeQuestion');
const AptitudeAttempt = require('../../models/AptitudeAttempt');
const {
  BadRequestException,
  ResourceNotFoundException,
  UnauthorizedActionException,
} = require('../../common/errors');
const C = require('./aptitude.constants');
const { gradeAttempt } = require('./aptitude.grading');
const { SEED_QUESTIONS } = require('./aptitude.seed');

// ───────────────────────── helpers ─────────────────────────

const uid = (user) => String(user.id);
const pct = (num, den) => (den > 0 ? Math.round((num / den) * 100) : 0);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const identityOrder = (n) => Array.from({ length: n }, (_, i) => i);

const endsAt = (attempt) => attempt.startedAt.getTime() + attempt.durationSeconds * 1000;
const isExpired = (attempt, now = Date.now()) => now > endsAt(attempt) + C.GRACE_SECONDS * 1000;
const remainingSeconds = (attempt, now = Date.now()) => Math.max(0, Math.ceil((endsAt(attempt) - now) / 1000));

/**
 * Seeds the starter question bank the first time it is needed (only when the
 * collection is completely empty). Works on serverless too, since it does not
 * depend on server.js. Upserting by seedKey keeps concurrent first requests
 * from creating duplicates.
 */
let seedPromise = null;
function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = (async () => {
      const count = await AptitudeQuestion.estimatedDocumentCount();
      if (count > 0) return;
      await AptitudeQuestion.bulkWrite(
        SEED_QUESTIONS.map(({ seedKey, ...rest }) => ({
          updateOne: {
            filter: { seedKey },
            update: { $setOnInsert: { ...rest, active: true } },
            upsert: true,
          },
        })),
        { ordered: false }
      );
    })().catch((err) => {
      seedPromise = null; // retry on the next request
      throw err;
    });
  }
  return seedPromise;
}

/** Converts a stored question + the option order used for this attempt into what the student sees. */
function toServed(doc, order) {
  const ord = order && order.length === doc.options.length ? order : identityOrder(doc.options.length);
  return {
    id: String(doc._id),
    category: doc.category,
    topic: doc.topic,
    difficulty: doc.difficulty,
    question: doc.question,
    options: ord.map((i) => doc.options[i]),
    correctIndex: ord.indexOf(doc.correctIndex),
    explanation: doc.explanation || '',
  };
}

async function loadServedQuestions(attempt) {
  const docs = await AptitudeQuestion.find({ _id: { $in: attempt.questionIds } }).lean();
  const byId = new Map(docs.map((d) => [String(d._id), d]));
  return attempt.questionIds
    .map((id, i) => {
      const doc = byId.get(String(id));
      return doc ? toServed(doc, attempt.optionOrders && attempt.optionOrders[i]) : null;
    })
    .filter(Boolean);
}

async function findOwnedAttempt(user, id) {
  if (!mongoose.isValidObjectId(id)) throw ResourceNotFoundException.of('Aptitude test', 'id', id);
  const attempt = await AptitudeAttempt.findById(id).lean();
  // Same error for "missing" and "not yours" so ids can't be probed.
  if (!attempt || attempt.userId !== uid(user)) throw ResourceNotFoundException.of('Aptitude test', 'id', id);
  return attempt;
}

const summarize = (a) => ({
  id: String(a._id),
  category: a.category,
  difficulty: a.difficulty,
  score: a.score,
  totalMarks: a.totalMarks,
  correct: a.correct,
  incorrect: a.incorrect,
  unanswered: a.unanswered,
  accuracy: a.accuracy,
  timeTakenSeconds: a.timeTakenSeconds,
  submittedAt: a.submittedAt,
});

function buildResult(attempt, served) {
  const answerByQuestion = new Map((attempt.answers || []).map((a) => [String(a.questionId), a.selectedIndex]));
  return {
    ...summarize(attempt),
    status: attempt.status,
    negativeMarking: attempt.negativeMarking,
    negativeMark: C.NEGATIVE_MARK,
    durationSeconds: attempt.durationSeconds,
    late: !!attempt.late,
    topicBreakdown: (attempt.topicBreakdown || []).map((t) => ({
      topic: t.topic,
      correct: t.correct,
      total: t.total,
      accuracy: pct(t.correct, t.total),
    })),
    review: served.map((q, i) => {
      const selected = answerByQuestion.has(q.id) ? answerByQuestion.get(q.id) : null;
      return {
        ...q,
        number: i + 1,
        selectedIndex: selected === undefined ? null : selected,
        isCorrect: selected !== null && selected !== undefined && selected === q.correctIndex,
      };
    }),
  };
}

// ───────────────────────── student ─────────────────────────

async function getOverview(user) {
  await ensureSeeded();
  const userId = uid(user);

  const [bank, submitted, active] = await Promise.all([
    AptitudeQuestion.aggregate([
      { $match: { active: true } },
      { $group: { _id: { category: '$category', difficulty: '$difficulty' }, count: { $sum: 1 } } },
    ]),
    AptitudeAttempt.find({ userId, status: 'SUBMITTED' }).sort({ submittedAt: -1 }).limit(200).lean(),
    AptitudeAttempt.findOne({ userId, status: 'IN_PROGRESS' }).sort({ startedAt: -1 }).lean(),
  ]);

  const available = {};
  for (const c of C.CATEGORIES) available[c] = { EASY: 0, MEDIUM: 0, HARD: 0, total: 0 };
  for (const row of bank) {
    const slot = available[row._id.category];
    if (slot) {
      slot[row._id.difficulty] = row.count;
      slot.total += row.count;
    }
  }

  const catStats = {};
  for (const c of C.CATEGORIES) catStats[c] = { tests: 0, questions: 0, correct: 0 };
  const topicStats = new Map();
  let servedTotal = 0;
  let correctTotal = 0;
  let bestScorePercent = 0;
  let scorePercentSum = 0;

  for (const a of submitted) {
    if (catStats[a.category]) catStats[a.category].tests += 1;
    for (const row of a.categoryBreakdown || []) {
      const s = catStats[row.category];
      if (s) {
        s.questions += row.total;
        s.correct += row.correct;
      }
    }
    for (const row of a.topicBreakdown || []) {
      const t = topicStats.get(row.topic) || { topic: row.topic, correct: 0, total: 0 };
      t.correct += row.correct;
      t.total += row.total;
      topicStats.set(row.topic, t);
    }
    servedTotal += a.totalMarks;
    correctTotal += a.correct;
    const scorePct = pct(a.score, a.totalMarks);
    bestScorePercent = Math.max(bestScorePercent, scorePct);
    scorePercentSum += scorePct;
  }

  const categories = C.CATEGORIES.map((key) => ({
    key,
    label: C.CATEGORY_META[key].label,
    description: C.CATEGORY_META[key].description,
    available: available[key],
    tests: catStats[key].tests,
    questionsAnswered: catStats[key].questions,
    accuracy: pct(catStats[key].correct, catStats[key].questions),
  }));

  // Topics where the student is weakest (needs a few questions before we judge).
  const focusAreas = [...topicStats.values()]
    .filter((t) => t.total >= 3)
    .map((t) => ({ topic: t.topic, total: t.total, accuracy: pct(t.correct, t.total) }))
    .filter((t) => t.accuracy < 70)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5);

  let activeAttempt = null;
  if (active) {
    if (isExpired(active)) {
      await AptitudeAttempt.updateOne({ _id: active._id, status: 'IN_PROGRESS' }, { $set: { status: 'ABANDONED' } });
    } else {
      activeAttempt = {
        id: String(active._id),
        category: active.category,
        difficulty: active.difficulty,
        questionCount: active.questionIds.length,
        remainingSeconds: remainingSeconds(active),
      };
    }
  }

  return {
    categories,
    mixedAvailable: C.CATEGORIES.reduce((sum, c) => sum + available[c].total, 0),
    stats: {
      testsTaken: submitted.length,
      questionsAnswered: servedTotal,
      accuracy: pct(correctTotal, servedTotal),
      bestScorePercent,
      averageScorePercent: submitted.length ? Math.round(scorePercentSum / submitted.length) : 0,
    },
    focusAreas,
    recent: submitted.slice(0, 8).map(summarize),
    activeAttempt,
    limits: {
      minQuestions: C.MIN_QUESTIONS,
      maxQuestions: C.MAX_QUESTIONS,
      secondsPerQuestion: C.SECONDS_PER_QUESTION,
      negativeMark: C.NEGATIVE_MARK,
    },
  };
}

async function startTest(user, { category, difficulty, count, negativeMarking }) {
  await ensureSeeded();
  const userId = uid(user);

  const match = { active: true };
  if (category !== 'MIXED') match.category = category;
  if (difficulty !== 'ANY') match.difficulty = difficulty;

  const available = await AptitudeQuestion.countDocuments(match);
  if (available < C.MIN_QUESTIONS) {
    throw new BadRequestException(
      `Only ${available} question(s) are available for this selection. Try a different difficulty, or ask your trainer to add more.`
    );
  }
  const size = Math.min(count, available);

  // Prefer questions the student hasn't seen in their last few tests.
  const recent = await AptitudeAttempt.find({ userId, status: 'SUBMITTED' })
    .sort({ submittedAt: -1 })
    .limit(5)
    .select('questionIds')
    .lean();
  const seen = recent.flatMap((a) => a.questionIds);

  const project = { $project: { _id: 1, options: 1, fixedOrder: 1 } };
  let picked = await AptitudeQuestion.aggregate([
    { $match: { ...match, _id: { $nin: seen } } },
    { $sample: { size } },
    project,
  ]);
  if (picked.length < size) {
    const exclude = picked.map((p) => p._id);
    const more = await AptitudeQuestion.aggregate([
      { $match: { ...match, _id: { $nin: exclude } } },
      { $sample: { size: size - picked.length } },
      project,
    ]);
    picked = picked.concat(more);
  }
  shuffleInPlace(picked);

  const optionOrders = picked.map((p) =>
    p.fixedOrder ? identityOrder(p.options.length) : shuffleInPlace(identityOrder(p.options.length))
  );

  // Only one test can be live at a time; starting a new one abandons the old one.
  await AptitudeAttempt.updateMany({ userId, status: 'IN_PROGRESS' }, { $set: { status: 'ABANDONED' } });

  const attempt = await AptitudeAttempt.create({
    userId,
    category,
    difficulty,
    negativeMarking: !!negativeMarking,
    questionIds: picked.map((p) => p._id),
    optionOrders,
    status: 'IN_PROGRESS',
    durationSeconds: picked.length * C.SECONDS_PER_QUESTION,
    totalMarks: picked.length,
    startedAt: new Date(),
  });

  return { attemptId: String(attempt._id), questionCount: picked.length, durationSeconds: attempt.durationSeconds };
}

async function getTest(user, id) {
  const attempt = await findOwnedAttempt(user, id);

  if (attempt.status === 'SUBMITTED') return { id: String(attempt._id), status: 'SUBMITTED' };

  if (attempt.status === 'ABANDONED' || isExpired(attempt)) {
    if (attempt.status === 'IN_PROGRESS') {
      await AptitudeAttempt.updateOne({ _id: attempt._id, status: 'IN_PROGRESS' }, { $set: { status: 'ABANDONED' } });
    }
    throw new BadRequestException('This test has expired or was replaced by a newer one. Please start a new practice test.');
  }

  const served = await loadServedQuestions(attempt);
  return {
    id: String(attempt._id),
    status: 'IN_PROGRESS',
    category: attempt.category,
    difficulty: attempt.difficulty,
    negativeMarking: attempt.negativeMarking,
    negativeMark: C.NEGATIVE_MARK,
    durationSeconds: attempt.durationSeconds,
    remainingSeconds: remainingSeconds(attempt),
    totalQuestions: served.length,
    // Deliberately NOT sending correctIndex / explanation while the test is live.
    questions: served.map(({ id: qid, category, topic, difficulty, question, options }) => ({
      id: qid,
      category,
      topic,
      difficulty,
      question,
      options,
    })),
  };
}

async function submitTest(user, id, { answers = [] }) {
  const attempt = await findOwnedAttempt(user, id);
  const served = await loadServedQuestions(attempt);

  // Idempotent: submitting twice (double click, retry) just returns the result.
  if (attempt.status === 'SUBMITTED') return buildResult(attempt, served);
  if (attempt.status !== 'IN_PROGRESS') {
    throw new BadRequestException('This test is no longer active. Please start a new practice test.');
  }

  const answerMap = new Map();
  for (const a of answers) answerMap.set(String(a.questionId), a.selectedIndex);

  // Grading happens only here, on the server, against the stored answer key.
  const graded = gradeAttempt(served, answerMap, attempt.negativeMarking);

  const now = Date.now();
  const elapsed = Math.round((now - attempt.startedAt.getTime()) / 1000);
  const updated = await AptitudeAttempt.findOneAndUpdate(
    { _id: attempt._id, status: 'IN_PROGRESS' },
    {
      $set: {
        status: 'SUBMITTED',
        submittedAt: new Date(now),
        timeTakenSeconds: Math.min(elapsed, attempt.durationSeconds),
        late: isExpired(attempt, now),
        answers: graded.answers,
        correct: graded.correct,
        incorrect: graded.incorrect,
        unanswered: graded.unanswered,
        score: graded.score,
        totalMarks: graded.totalMarks,
        accuracy: graded.accuracy,
        topicBreakdown: graded.topicBreakdown,
        categoryBreakdown: graded.categoryBreakdown,
      },
    },
    { new: true }
  ).lean();

  if (!updated) {
    // Lost a race with a parallel submit; return whatever was stored.
    const fresh = await AptitudeAttempt.findById(attempt._id).lean();
    return buildResult(fresh, served);
  }
  return buildResult(updated, served);
}

async function getResult(user, id) {
  const attempt = await findOwnedAttempt(user, id);
  if (attempt.status !== 'SUBMITTED') {
    throw new BadRequestException('Submit the test to see its results.');
  }
  return buildResult(attempt, await loadServedQuestions(attempt));
}

// ───────────────── admin / trainer: question bank ─────────────────

function toAdminQuestion(doc, user) {
  return {
    id: String(doc._id),
    category: doc.category,
    topic: doc.topic,
    difficulty: doc.difficulty,
    question: doc.question,
    options: doc.options,
    correctIndex: doc.correctIndex,
    explanation: doc.explanation || '',
    fixedOrder: !!doc.fixedOrder,
    builtIn: !!doc.seedKey,
    createdAt: doc.createdAt,
    // Admins can change anything; trainers only the questions they created.
    canEdit: user.role === 'ADMIN' || (!!doc.createdBy && doc.createdBy === uid(user)),
  };
}

async function listQuestions(user, { category, difficulty, search, page, limit }) {
  await ensureSeeded();

  const filter = { active: true };
  if (C.CATEGORIES.includes(category)) filter.category = category;
  if (C.DIFFICULTIES.includes(difficulty)) filter.difficulty = difficulty;
  if (search) {
    const rx = new RegExp(escapeRegex(String(search).slice(0, 100)), 'i');
    filter.$or = [{ question: rx }, { topic: rx }];
  }

  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);

  const [total, docs, byCategory] = await Promise.all([
    AptitudeQuestion.countDocuments(filter),
    AptitudeQuestion.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    AptitudeQuestion.aggregate([{ $match: { active: true } }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);

  const summary = Object.fromEntries(C.CATEGORIES.map((c) => [c, 0]));
  for (const row of byCategory) if (row._id in summary) summary[row._id] = row.count;

  return {
    items: docs.map((d) => toAdminQuestion(d, user)),
    total,
    page: safePage,
    limit: safeLimit,
    pages: Math.max(Math.ceil(total / safeLimit), 1),
    summary,
  };
}

async function createQuestion(user, body) {
  await ensureSeeded();
  const doc = await AptitudeQuestion.create({ ...body, createdBy: uid(user) });
  return toAdminQuestion(doc.toObject(), user);
}

async function bulkCreate(user, questions) {
  await ensureSeeded();

  const norm = (q) => `${q.category}|${q.question.trim().toLowerCase()}`;
  const existing = await AptitudeQuestion.find({
    active: true,
    question: { $in: questions.map((q) => q.question) },
  })
    .select('category question')
    .lean();
  const known = new Set(existing.map(norm));

  const toInsert = [];
  for (const q of questions) {
    const key = norm(q);
    if (known.has(key)) continue; // duplicate of an existing question or earlier row
    known.add(key);
    toInsert.push({ ...q, createdBy: uid(user) });
  }

  if (toInsert.length > 0) await AptitudeQuestion.insertMany(toInsert, { ordered: false });
  return { created: toInsert.length, skipped: questions.length - toInsert.length };
}

async function loadManageable(user, id) {
  if (!mongoose.isValidObjectId(id)) throw ResourceNotFoundException.of('Aptitude question', 'id', id);
  const doc = await AptitudeQuestion.findById(id);
  if (!doc || !doc.active) throw ResourceNotFoundException.of('Aptitude question', 'id', id);
  const allowed = user.role === 'ADMIN' || (!!doc.createdBy && doc.createdBy === uid(user));
  if (!allowed) throw new UnauthorizedActionException('You can only change questions that you created.');
  return doc;
}

async function updateQuestion(user, id, body) {
  const doc = await loadManageable(user, id);
  doc.set(body);
  await doc.save();
  return toAdminQuestion(doc.toObject(), user);
}

async function removeQuestion(user, id) {
  const doc = await loadManageable(user, id);
  // Soft delete: students' past tests still need the question for their review.
  doc.active = false;
  await doc.save();
}

module.exports = {
  getOverview,
  startTest,
  getTest,
  submitTest,
  getResult,
  listQuestions,
  createQuestion,
  bulkCreate,
  updateQuestion,
  removeQuestion,
};
