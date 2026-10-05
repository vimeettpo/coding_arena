const { z } = require('zod');

const testCaseSchema = z.object({
  input: z.string(),
  expectedOutput: z.string(),
  hidden: z.boolean().default(true),
  weight: z.number().int().positive().optional(),
});

const createProblemSchema = z.object({
  title: z.string().min(1),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  description: z.string(),
  constraints: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  hints: z.array(z.string()).optional().default([]),
  timeLimitMs: z.number().int().positive().optional(),
  memoryLimitMb: z.number().int().positive().optional(),
  testCases: z.array(testCaseSchema).min(1),
});

const runSchema = z.object({
  language: z.string().min(1),
  code: z.string(),
  customInput: z.string().optional().nullable(),
});

const submitSchema = z.object({
  language: z.string().min(1),
  code: z.string(),
});

const compileSchema = z.object({
  language: z.string().min(1),
  code: z.string(),
  stdin: z.string().optional().nullable(),
  customInput: z.string().optional().nullable(),
});

module.exports = { createProblemSchema, runSchema, submitSchema, compileSchema };
