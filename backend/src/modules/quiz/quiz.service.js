const { v4: uuidv4 } = require('uuid');
const Quiz = require('../../models/Quiz');
const QuizAttempt = require('../../models/QuizAttempt');
const Problem = require('../../models/Problem');
const { BadRequestException, ResourceNotFoundException } = require('../../common/errors');
const { query } = require('../../config/postgres');

async function create(request, creator) {
  if (request.startTime && request.endTime && !(new Date(request.endTime) > new Date(request.startTime))) {
    throw new BadRequestException('Test end time must be after the start time.');
  }

  let totalMarks = 0;
  const questions = (request.questions || []).map((q) => {
    const points = Math.max(1, q.points || 5);
    totalMarks += points;
    return {
      id: uuidv4(),
      questionText: q.questionText,
      options: q.options,
      correctOptionIndex: q.correctOptionIndex,
      points,
    };
  });

  const codingProblems = (request.codingProblems || []).map((cp) => {
    const points = Math.max(1, cp.points || 20);
    totalMarks += points;
    return {
      problemId: cp.problemId,
      points,
    };
  });

  if (questions.length === 0 && codingProblems.length === 0) {
    throw new BadRequestException('A test must contain at least one MCQ question or one coding problem.');
  }

  const now = new Date();
  const startTime = request.startTime ? new Date(request.startTime) : now;
  const endTime = request.endTime ? new Date(request.endTime) : new Date(now.getTime() + 10 * 365 * 24 * 60 * 60 * 1000); // 10 years default

  return Quiz.create({
    title: request.title.trim(),
    description: request.description || '',
    startTime,
    endTime,
    durationMinutes: request.durationMinutes || 30,
    totalMarks,
    createdById: creator.id,
    questions,
    codingProblems,
    allowedLanguages: Array.isArray(request.allowedLanguages) ? request.allowedLanguages : [],
    targetBranch: request.targetBranch || 'ALL',
    targetYear: request.targetYear || null,
    negativeMarking: Boolean(request.negativeMarking),
    negativeMarks: Number(request.negativeMarks) || 0,
    passingPercentage: Number(request.passingPercentage) || 40,
  });
}

async function list(currentUser) {
  const quizzes = await Quiz.find().sort({ createdAt: -1 });
  const userId = currentUser ? currentUser.id : null;

  return Promise.all(
    quizzes.map(async (q) => {
      let attempted = false;
      let score = null;
      if (userId) {
        const attempt = await QuizAttempt.findOne({ quizId: q.id, userId });
        if (attempt) {
          attempted = true;
          score = attempt.score;
        }
      }
      return {
        id: q.id,
        title: q.title,
        description: q.description,
        startTime: q.startTime,
        endTime: q.endTime,
        durationMinutes: q.durationMinutes,
        questionCount: (q.questions || []).length,
        codingCount: (q.codingProblems || []).length,
        allowedLanguages: q.allowedLanguages || [],
        targetBranch: q.targetBranch || 'ALL',
        targetYear: q.targetYear || null,
        negativeMarking: Boolean(q.negativeMarking),
        negativeMarks: q.negativeMarks || 0,
        passingPercentage: q.passingPercentage || 40,
        totalMarks: q.totalMarks,
        status: q.getStatus(),
        attempted,
        score,
      };
    })
  );
}

async function getDetail(quizId, currentUser) {
  const quiz = await getById(quizId);
  const userId = currentUser ? currentUser.id : null;

  let attempted = false;
  let score = null;
  let userAttempt = null;
  if (userId) {
    const attempt = await QuizAttempt.findOne({ quizId, userId });
    if (attempt) {
      attempted = true;
      score = attempt.score;
      userAttempt = attempt;
    }
  }

  // Show answer keys only if the user created the quiz or already attempted it.
  const showAnswers = attempted || (currentUser && currentUser.id === quiz.createdById);

  const questions = (quiz.questions || []).map((q) => ({
    id: q.id,
    questionText: q.questionText,
    options: q.options,
    points: q.points,
    correctOptionIndex: showAnswers ? q.correctOptionIndex : null,
  }));

  // Fetch populated coding problem details
  let populatedCodingProblems = [];
  if (quiz.codingProblems && quiz.codingProblems.length > 0) {
    const problemIds = quiz.codingProblems.map((cp) => cp.problemId);
    const problems = await Problem.find({ _id: { $in: problemIds } }).lean();
    const problemMap = {};
    problems.forEach((p) => {
      problemMap[String(p._id)] = p;
    });

    populatedCodingProblems = quiz.codingProblems.map((cp) => {
      const p = problemMap[String(cp.problemId)] || {};
      return {
        problemId: String(cp.problemId),
        points: cp.points,
        title: p.title || 'Coding Problem',
        slug: p.slug || '',
        difficulty: p.difficulty || 'MEDIUM',
        description: p.description || '',
        constraints: p.constraints || '',
        sampleTestCases: p.sampleTestCases || [],
        timeLimitMs: p.timeLimitMs || 1000,
        memoryLimitMb: p.memoryLimitMb || 256,
      };
    });
  }

  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    startTime: quiz.startTime,
    endTime: quiz.endTime,
    durationMinutes: quiz.durationMinutes,
    totalMarks: quiz.totalMarks,
    allowedLanguages: quiz.allowedLanguages || [],
    targetBranch: quiz.targetBranch || 'ALL',
    targetYear: quiz.targetYear || null,
    negativeMarking: Boolean(quiz.negativeMarking),
    negativeMarks: quiz.negativeMarks || 0,
    passingPercentage: quiz.passingPercentage || 40,
    status: quiz.getStatus(),
    attempted,
    score,
    questions,
    codingProblems: populatedCodingProblems,
    userAttempt: userAttempt ? {
      answers: userAttempt.answers ? Object.fromEntries(userAttempt.answers) : {},
      codingScores: userAttempt.codingScores || [],
      mcqScore: userAttempt.mcqScore || 0,
      codingScore: userAttempt.codingScore || 0,
      score: userAttempt.score,
    } : null,
  };
}

async function submit(quizId, request, student) {
  const quiz = await getById(quizId);

  if (quiz.getStatus() === 'UPCOMING') {
    throw new BadRequestException('This test has not started yet.');
  }
  if (quiz.getStatus() === 'ENDED') {
    throw new BadRequestException('This test has already ended.');
  }
  if (await QuizAttempt.exists({ quizId, userId: student.id })) {
    throw new BadRequestException('You have already submitted this test.');
  }

  // 1. Grade MCQs
  const userAnswers = request.answers || {};
  let mcqRawScore = 0;
  const questionResults = (quiz.questions || []).map((q) => {
    const selectedOpt = Object.prototype.hasOwnProperty.call(userAnswers, q.id) ? userAnswers[q.id] : null;
    const isCorrect = selectedOpt !== null && selectedOpt === q.correctOptionIndex;
    let pointsEarned = 0;
    if (isCorrect) {
      pointsEarned = q.points;
    } else if (selectedOpt !== null && quiz.negativeMarking && quiz.negativeMarks > 0) {
      pointsEarned = -quiz.negativeMarks;
    }
    mcqRawScore += pointsEarned;
    return {
      questionId: q.id,
      questionText: q.questionText,
      options: q.options,
      selectedOptionIndex: selectedOpt,
      correctOptionIndex: q.correctOptionIndex,
      correct: isCorrect,
      isCorrect: isCorrect,
      pointsEarned,
      maxPoints: q.points,
    };
  });
  const mcqScore = Math.max(0, mcqRawScore);

  // 2. Process Coding Problem Submissions
  const codingSubmissions = request.codingSubmissions || [];
  const codingSubMap = {};
  codingSubmissions.forEach((cs) => {
    codingSubMap[String(cs.problemId)] = cs;
  });

  let codingScore = 0;
  const processedCodingScores = (quiz.codingProblems || []).map((cp) => {
    const pId = String(cp.problemId);
    const sub = codingSubMap[pId];
    const earned = sub ? Math.min(cp.points, Math.max(0, Number(sub.score) || 0)) : 0;
    codingScore += earned;
    return {
      problemId: pId,
      score: earned,
      status: sub ? (sub.status || 'SUBMITTED') : 'NOT_ATTEMPTED',
      language: sub ? (sub.language || '') : '',
      code: sub ? (sub.code || '') : '',
    };
  });

  const totalScore = mcqScore + codingScore;

  const attempt = await QuizAttempt.create({
    quizId,
    userId: student.id,
    answers: userAnswers,
    mcqScore,
    codingScore,
    codingScores: processedCodingScores,
    score: totalScore,
    totalMarks: quiz.totalMarks,
    completed: true,
    submittedAt: new Date(),
  });

  try {
    const leaderboardService = require('../leaderboard/leaderboard.service');
    const { broadcastLeaderboard } = require('../../websocket/socket');
    const entries = await leaderboardService.getLeaderboard(null);
    broadcastLeaderboard(null, entries);
  } catch (_e) {
    // Ignore socket error if websocket is disabled
  }

  const percentage = quiz.totalMarks > 0 ? Math.round((totalScore / quiz.totalMarks) * 1000) / 10 : 0;

  return {
    attemptId: attempt.id,
    quizId: quiz.id,
    quizTitle: quiz.title,
    mcqScore,
    codingScore,
    score: totalScore,
    totalMarks: quiz.totalMarks,
    percentage,
    completed: true,
    submittedAt: attempt.submittedAt,
    questionResults,
    codingScores: processedCodingScores,
  };
}

async function getResult(quizId, student) {
  const quiz = await getById(quizId);
  const attempt = await QuizAttempt.findOne({ quizId, userId: student.id });
  if (!attempt) throw new ResourceNotFoundException('No submission found for this test.');

  const userAnswers = attempt.answers ? Object.fromEntries(attempt.answers) : {};
  const questionResults = (quiz.questions || []).map((q) => {
    const selectedOpt = Object.prototype.hasOwnProperty.call(userAnswers, q.id) ? userAnswers[q.id] : null;
    const isCorrect = selectedOpt !== null && selectedOpt === q.correctOptionIndex;
    let pointsEarned = 0;
    if (isCorrect) {
      pointsEarned = q.points;
    } else if (selectedOpt !== null && quiz.negativeMarking && quiz.negativeMarks > 0) {
      pointsEarned = -quiz.negativeMarks;
    }
    return {
      questionId: q.id,
      questionText: q.questionText,
      options: q.options,
      selectedOptionIndex: selectedOpt,
      correctOptionIndex: q.correctOptionIndex,
      correct: isCorrect,
      isCorrect: isCorrect,
      pointsEarned,
      maxPoints: q.points,
    };
  });

  const percentage = quiz.totalMarks > 0 ? Math.round((attempt.score / quiz.totalMarks) * 1000) / 10 : 0;

  return {
    attemptId: attempt.id,
    quizId: quiz.id,
    quizTitle: quiz.title,
    mcqScore: attempt.mcqScore || 0,
    codingScore: attempt.codingScore || 0,
    codingScores: attempt.codingScores || [],
    score: attempt.score,
    totalMarks: quiz.totalMarks,
    percentage,
    completed: attempt.completed,
    submittedAt: attempt.submittedAt,
    questionResults,
  };
}

async function getById(id) {
  const quiz = await Quiz.findById(id).catch(() => null);
  if (!quiz) throw ResourceNotFoundException.of('Test / Quiz', 'id', id);
  return quiz;
}

async function remove(quizId, user) {
  await getById(quizId);
  await Quiz.deleteOne({ _id: quizId });
  await QuizAttempt.deleteMany({ quizId });
  return true;
}

async function getQuizLeaderboard(quizId) {
  const quiz = await getById(quizId);
  const attempts = await QuizAttempt.find({ quizId: String(quiz._id), completed: true })
    .sort({ score: -1, submittedAt: 1 })
    .lean();

  if (attempts.length === 0) {
    return {
      quizId: quiz.id,
      quizTitle: quiz.title,
      totalMarks: quiz.totalMarks,
      durationMinutes: quiz.durationMinutes,
      standings: [],
    };
  }

  const userIds = attempts.map((a) => String(a.userId));
  let userMap = {};
  if (userIds.length > 0) {
    try {
      const res = await query(
        `SELECT id, name, email, college_id, branch, year FROM users WHERE id::text = ANY($1)`,
        [userIds]
      );
      res.rows.forEach((r) => {
        userMap[String(r.id)] = r;
      });
    } catch (err) {
      console.error('Error fetching quiz leaderboard users from Postgres:', err.message);
    }
  }

  const standings = attempts.map((a, idx) => {
    const u = userMap[String(a.userId)] || {};
    const totalMarks = a.totalMarks || quiz.totalMarks || 1;
    const percentage = Math.round((a.score / totalMarks) * 100);
    return {
      rank: idx + 1,
      userId: a.userId,
      name: u.name || 'Student',
      email: u.email || 'N/A',
      collegeId: u.college_id || '—',
      branch: u.branch || '—',
      year: u.year || null,
      score: a.score,
      totalMarks,
      percentage,
      submittedAt: a.submittedAt,
    };
  });

  return {
    quizId: quiz.id,
    quizTitle: quiz.title,
    totalMarks: quiz.totalMarks,
    durationMinutes: quiz.durationMinutes,
    standings,
  };
}

module.exports = { create, list, getDetail, submit, getResult, getById, remove, getQuizLeaderboard };
