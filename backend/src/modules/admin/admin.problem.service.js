const Problem = require('../../models/Problem');
const TestCase = require('../../models/TestCase');
const { ResourceNotFoundException, DuplicateResourceException } = require('../../common/errors');

function slugify(title) {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * List all problems for admin with test cases count and draft status.
 */
async function listAllProblems({ page = 0, size = 20, search = '', difficulty = '', published = '' }) {
  const p = Math.max(0, parseInt(page, 10));
  const s = Math.min(100, Math.max(1, parseInt(size, 10)));

  const filter = {};
  if (difficulty) {
    filter.difficulty = difficulty.toUpperCase();
  }
  if (published === 'true') {
    filter.published = true;
  } else if (published === 'false') {
    filter.published = false;
  }
  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [{ title: regex }, { tags: regex }, { slug: regex }];
  }

  const [problems, total] = await Promise.all([
    Problem.find(filter)
      .sort({ createdAt: -1 })
      .skip(p * s)
      .limit(s)
      .lean(),
    Problem.countDocuments(filter),
  ]);

  // Attach test case counts
  const content = await Promise.all(
    problems.map(async (prob) => {
      const [sampleCount, hiddenCount] = await Promise.all([
        TestCase.countDocuments({ problemId: prob._id, hidden: false }),
        TestCase.countDocuments({ problemId: prob._id, hidden: true }),
      ]);

      return {
        id: String(prob._id),
        title: prob.title,
        slug: prob.slug,
        difficulty: prob.difficulty,
        tags: prob.tags || [],
        published: prob.published,
        timeLimitMs: prob.timeLimitMs,
        memoryLimitMb: prob.memoryLimitMb,
        sampleTestCasesCount: sampleCount,
        hiddenTestCasesCount: hiddenCount,
        createdAt: prob.createdAt,
        updatedAt: prob.updatedAt,
      };
    })
  );

  return {
    content,
    page: p,
    size: s,
    totalElements: total,
    totalPages: Math.ceil(total / s) || 1,
  };
}

/**
 * Create a new problem in Code Bank
 */
async function createProblem(data, creator) {
  let baseSlug = slugify(data.title);
  let slug = baseSlug;
  let counter = 1;

  while (await Problem.exists({ slug })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const problem = await Problem.create({
    title: data.title.trim(),
    slug,
    difficulty: data.difficulty,
    description: data.description,
    constraints: data.constraints || '',
    editorial: data.editorial || null,
    tags: Array.isArray(data.tags) ? data.tags : [],
    hints: Array.isArray(data.hints) ? data.hints : [],
    timeLimitMs: data.timeLimitMs || 1000,
    memoryLimitMb: data.memoryLimitMb || 256,
    published: data.published !== false,
    createdById: String(creator.id),
  });

  // Create sample test cases if provided
  if (Array.isArray(data.sampleTestCases) && data.sampleTestCases.length > 0) {
    for (const stc of data.sampleTestCases) {
      if (stc.input !== undefined && stc.expectedOutput !== undefined) {
        await TestCase.create({
          problemId: problem._id,
          input: stc.input,
          expectedOutput: stc.expectedOutput,
          hidden: false,
        });
      }
    }
  }

  return {
    id: String(problem._id),
    title: problem.title,
    slug: problem.slug,
    difficulty: problem.difficulty,
    published: problem.published,
  };
}

/**
 * Update problem metadata
 */
async function updateProblem(id, data) {
  const problem = await Problem.findById(id);
  if (!problem) {
    throw ResourceNotFoundException.of('Problem', 'id', id);
  }

  if (data.title && data.title.trim() !== problem.title) {
    problem.title = data.title.trim();
  }
  if (data.difficulty) problem.difficulty = data.difficulty;
  if (data.description !== undefined) problem.description = data.description;
  if (data.constraints !== undefined) problem.constraints = data.constraints;
  if (data.editorial !== undefined) problem.editorial = data.editorial;
  if (data.tags !== undefined) problem.tags = data.tags;
  if (data.hints !== undefined) problem.hints = data.hints;
  if (data.timeLimitMs !== undefined) problem.timeLimitMs = data.timeLimitMs;
  if (data.memoryLimitMb !== undefined) problem.memoryLimitMb = data.memoryLimitMb;
  if (data.published !== undefined) problem.published = data.published;

  await problem.save();
  return problem;
}

/**
 * Toggle problem publish / draft
 */
async function togglePublish(id) {
  const problem = await Problem.findById(id);
  if (!problem) {
    throw ResourceNotFoundException.of('Problem', 'id', id);
  }

  problem.published = !problem.published;
  await problem.save();

  return {
    id: String(problem._id),
    published: problem.published,
    message: `Problem is now ${problem.published ? 'Published' : 'Draft'}.`,
  };
}

/**
 * Delete a problem and its test cases
 */
async function deleteProblem(id) {
  const problem = await Problem.findById(id);
  if (!problem) {
    throw ResourceNotFoundException.of('Problem', 'id', id);
  }

  await TestCase.deleteMany({ problemId: problem._id });
  await Problem.findByIdAndDelete(id);

  return { message: `Problem "${problem.title}" deleted successfully.` };
}

/**
 * Test case management
 */
async function getTestCases(problemId) {
  const testCases = await TestCase.find({ problemId }).lean();
  return testCases.map((tc) => ({
    id: String(tc._id),
    problemId: String(tc.problemId),
    input: tc.input,
    expectedOutput: tc.expectedOutput,
    hidden: tc.hidden,
    createdAt: tc.createdAt,
  }));
}

async function addTestCase(problemId, data) {
  const problem = await Problem.findById(problemId);
  if (!problem) {
    throw ResourceNotFoundException.of('Problem', 'id', problemId);
  }

  const tc = await TestCase.create({
    problemId: problem._id,
    input: data.input || '',
    expectedOutput: data.expectedOutput || '',
    hidden: Boolean(data.hidden),
  });

  return {
    id: String(tc._id),
    problemId: String(tc.problemId),
    input: tc.input,
    expectedOutput: tc.expectedOutput,
    hidden: tc.hidden,
  };
}

async function deleteTestCase(testCaseId) {
  const tc = await TestCase.findByIdAndDelete(testCaseId);
  if (!tc) {
    throw ResourceNotFoundException.of('TestCase', 'id', testCaseId);
  }
  return { message: 'Test case deleted successfully.' };
}

module.exports = {
  listAllProblems,
  createProblem,
  updateProblem,
  togglePublish,
  deleteProblem,
  getTestCases,
  addTestCase,
  deleteTestCase,
};
