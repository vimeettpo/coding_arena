const { z } = require('zod');

const questionSchema = z.object({
  questionText: z.string().min(1),
  options: z.array(z.string()).min(2),
  correctOptionIndex: z.number().int().nonnegative(),
  points: z.number().int().positive().optional().default(5),
});

const codingProblemSchema = z.object({
  problemId: z.string().min(1),
  points: z.coerce.number().int().positive().optional().default(20),
});

const createQuizSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional().default(''),
    startTime: z.coerce.date().optional().nullable(),
    endTime: z.coerce.date().optional().nullable(),
    durationMinutes: z.coerce.number().int().positive().optional().default(30),
    questions: z.array(questionSchema).optional().default([]),
    codingProblems: z.array(codingProblemSchema).optional().default([]),
    allowedLanguages: z.array(z.string()).optional().default([]),
    targetBranch: z.string().optional().default('ALL'),
    targetYear: z.coerce.number().int().min(1).max(4).optional().nullable(),
    negativeMarking: z.boolean().optional().default(false),
    negativeMarks: z.coerce.number().nonnegative().optional().default(0),
    passingPercentage: z.coerce.number().min(0).max(100).optional().default(40),
  })
  .refine(
    (data) => (data.questions && data.questions.length > 0) || (data.codingProblems && data.codingProblems.length > 0),
    {
      message: 'Test must include at least one MCQ question or one coding problem.',
      path: ['questions'],
    }
  );

const submitQuizSchema = z.object({
  answers: z.record(z.string(), z.number().int()).optional().default({}),
  codingSubmissions: z
    .array(
      z.object({
        problemId: z.string(),
        score: z.coerce.number().nonnegative().optional().default(0),
        status: z.string().optional().default('SUBMITTED'),
        language: z.string().optional().default(''),
        code: z.string().optional().default(''),
      })
    )
    .optional()
    .default([]),
});

module.exports = { createQuizSchema, submitQuizSchema };
