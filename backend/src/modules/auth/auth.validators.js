const { z } = require('zod');

// Mirrors RegisterRequest's @Pattern: at least 8 chars, a number, a symbol.
const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters and include a number and a symbol.')
  .max(72)
  .regex(
    /^(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/,
    'Password must be at least 8 characters and include a number and a symbol.'
  );

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: passwordRule,
  role: z.enum(['STUDENT', 'TRAINER']), // ADMIN cannot self-register — enforced again in the service
  college: z.string().optional().nullable(),
});

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().optional().default(''),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().optional().default(''),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().optional().default(''),
  newPassword: z.string().min(8).max(72),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
};
