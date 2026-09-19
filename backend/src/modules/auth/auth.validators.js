const { z } = require('zod');

// At least 8 characters
const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters.');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(120),
  email: z.string().email('Please enter a valid email address.'),
  password: passwordRule,
  role: z.enum(['STUDENT', 'TRAINER']).optional().default('STUDENT'),
  college: z.string().optional().nullable(),
  username: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required.'),
  password: z.string().min(1, 'Password is required.'),
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
  refreshToken: z.string().min(1, 'Refresh token is required.'),
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
};
