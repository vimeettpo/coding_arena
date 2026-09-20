const { z } = require('zod');
const { COLLEGE_BRANCHES } = require('./admin.constants');

const roleEnum = z.enum(['STUDENT', 'TRAINER', 'ADMIN']);

const createUserSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(6),
  role: roleEnum.default('STUDENT'),
  college: z.string().trim().optional().default('VIMEET'),
  collegeId: z.string().trim().optional().nullable().default(''),
  branch: z.string().trim().optional().nullable(),
  year: z.coerce.number().int().min(1).max(4).optional().nullable(),
  teachingDomain: z.string().trim().optional().nullable(),
});

const bulkImportItemSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  collegeId: z.string().trim().optional().default(''),
  branch: z.string().trim(),
  year: z.coerce.number().int().min(1).max(4),
  role: roleEnum.default('STUDENT'),
});

const bulkImportSchema = z.object({
  students: z.array(bulkImportItemSchema).min(1),
  defaultPassword: z.string().min(6).default('Student@123'),
});

const updateRoleSchema = z.object({
  role: roleEnum,
});

const updateStatusSchema = z.object({
  enabled: z.boolean(),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6),
});

const updateUserSchema = z.object({
  name: z.string().trim().min(2).optional(),
  college: z.string().trim().optional().nullable(),
  collegeId: z.string().trim().optional().nullable(),
  branch: z.string().trim().optional().nullable(),
  year: z.coerce.number().int().min(1).max(4).optional().nullable(),
  teachingDomain: z.string().trim().optional().nullable(),
});

const adminProblemSchema = z.object({
  title: z.string().trim().min(3),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  description: z.string().trim().min(5),
  constraints: z.string().optional().default(''),
  editorial: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  hints: z.array(z.string()).default([]),
  timeLimitMs: z.coerce.number().int().min(100).max(10000).default(1000),
  memoryLimitMb: z.coerce.number().int().min(64).max(1024).default(256),
  published: z.boolean().default(true),
  sampleTestCases: z
    .array(
      z.object({
        input: z.string().default(''),
        expectedOutput: z.string().default(''),
      })
    )
    .optional()
    .default([]),
});

const adminTestCaseSchema = z.object({
  input: z.string().default(''),
  expectedOutput: z.string().default(''),
  hidden: z.boolean().default(false),
});

const adminContestSchema = z.object({
  title: z.string().trim().min(3),
  description: z.string().optional().default(''),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  negativeMarking: z.boolean().optional().default(false),
  problemIds: z.array(z.string()).min(1),
  allowedLanguages: z.array(z.string()).optional().default([]),
  targetBranch: z.string().optional().default('ALL'),
  targetYear: z.coerce.number().int().min(1).max(4).optional().nullable(),
  passingPercentage: z.coerce.number().min(0).max(100).optional().default(50),
});

module.exports = {
  createUserSchema,
  bulkImportSchema,
  updateRoleSchema,
  updateStatusSchema,
  resetPasswordSchema,
  updateUserSchema,
  adminProblemSchema,
  adminTestCaseSchema,
  adminContestSchema,
};
