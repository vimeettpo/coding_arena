const Problem = require('../../models/Problem');
const TestCase = require('../../models/TestCase');
const Submission = require('../../models/Submission');
const { DuplicateResourceException, ResourceNotFoundException } = require('../../common/errors');

const NON_ALPHANUMERIC = /[^a-z0-9]+/g;

function slugify(title) {
  const normalized = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return normalized.replace(NON_ALPHANUMERIC, '-').replace(/^-|-$/g, '');
}

async function list(difficulty, page, size, currentUser) {
  const filter = { published: true };
  if (difficulty) filter.difficulty = difficulty;

  const [problems, total] = await Promise.all([
    Problem.find(filter).skip(page * size).limit(size).sort({ createdAt: -1 }),
    Problem.countDocuments(filter),
  ]);

  const content = await Promise.all(problems.map((p) => toSummary(p, currentUser)));

  return {
    content,
    page,
    size,
    totalElements: total,
    totalPages: Math.ceil(total / size) || 1,
  };
}

async function getDetail(slug) {
  const problem = await getPublishedBySlug(slug);
  const visible = await TestCase.find({ problemId: problem._id, hidden: false });
  const examples = visible.map((tc) => ({ input: tc.input, expectedOutput: tc.expectedOutput }));

  return {
    id: problem.id,
    title: problem.title,
    slug: problem.slug,
    difficulty: problem.difficulty,
    description: problem.description,
    constraints: problem.constraints,
    tags: problem.tags,
    hints: problem.hints,
    examples,
    timeLimitMs: problem.timeLimitMs,
    memoryLimitMb: problem.memoryLimitMb,
  };
}

async function getPublishedBySlug(slug) {
  const problem = await Problem.findOne({ slug });
  if (!problem || !problem.published) {
    throw ResourceNotFoundException.of('Problem', 'slug', slug);
  }
  return problem;
}

async function create(request, creator) {
  const slug = slugify(request.title);
  if (await Problem.exists({ slug })) {
    throw new DuplicateResourceException('A problem with a matching title/slug already exists.');
  }

  const problem = await Problem.create({
    title: request.title,
    slug,
    difficulty: request.difficulty,
    description: request.description,
    constraints: request.constraints,
    tags: request.tags || [],
    hints: request.hints || [],
    timeLimitMs: request.timeLimitMs || 1000,
    memoryLimitMb: request.memoryLimitMb || 256,
    createdById: creator.id,
    published: false, // requires an explicit publish step, e.g. after review
  });

  await TestCase.insertMany(
    request.testCases.map((tc) => ({
      problemId: problem._id,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      hidden: tc.hidden,
      weight: tc.weight || 1,
    }))
  );

  return problem;
}

async function toSummary(problem, currentUser) {
  const [accepted, total, solved] = await Promise.all([
    Submission.countDocuments({ problemId: problem._id, verdict: 'ACCEPTED' }),
    Submission.countDocuments({ problemId: problem._id }),
    currentUser
      ? Submission.exists({ userId: currentUser.id, problemId: problem._id, verdict: 'ACCEPTED' })
      : Promise.resolve(false),
  ]);
  const acceptanceRate = total === 0 ? 0 : Math.round((accepted * 1000) / total) / 10;

  return {
    id: problem.id,
    title: problem.title,
    slug: problem.slug,
    difficulty: problem.difficulty,
    tags: problem.tags,
    solved: Boolean(solved),
    acceptanceRate,
  };
}

module.exports = { list, getDetail, getPublishedBySlug, create, slugify };
