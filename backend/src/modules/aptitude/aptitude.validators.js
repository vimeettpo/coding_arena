const { z } = require('zod');
const { CATEGORIES, DIFFICULTIES, MIN_QUESTIONS, MAX_QUESTIONS } = require('./aptitude.constants');

// ── Student: start / submit ──────────────────────────────────────────
const startTestSchema = z.object({
  category: z.enum([...CATEGORIES, 'MIXED']),
  difficulty: z.enum(['ANY', ...DIFFICULTIES]).optional().default('ANY'),
  count: z.coerce.number().int().min(MIN_QUESTIONS).max(MAX_QUESTIONS).optional().default(10),
  negativeMarking: z.boolean().optional().default(false),
});

const submitTestSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        selectedIndex: z.number().int().min(0).max(5).nullable(),
      })
    )
    .max(MAX_QUESTIONS)
    .optional()
    .default([]),
});

// ── Admin / trainer: question bank ───────────────────────────────────
const questionSchema = z
  .object({
    category: z.enum(CATEGORIES),
    topic: z.string().trim().min(2, 'Topic is required.').max(60),
    difficulty: z.enum(DIFFICULTIES),
    question: z.string().trim().min(5, 'Question text is too short.').max(2000),
    options: z.array(z.string().trim().min(1, 'Options cannot be empty.').max(300)).min(2).max(6),
    correctIndex: z.coerce.number().int().min(0),
    explanation: z.string().trim().max(3000).optional().default(''),
    fixedOrder: z.boolean().optional().default(false),
  })
  .refine((d) => d.correctIndex < d.options.length, {
    message: 'The correct answer must be one of the options.',
    path: ['correctIndex'],
  })
  .refine((d) => new Set(d.options.map((o) => o.toLowerCase())).size === d.options.length, {
    message: 'Options must be different from each other.',
    path: ['options'],
  });

const bulkQuestionsSchema = z.object({
  questions: z.array(questionSchema).min(1, 'Provide at least one question.').max(200, 'Maximum 200 questions per import.'),
});

module.exports = { startTestSchema, submitTestSchema, questionSchema, bulkQuestionsSchema };
