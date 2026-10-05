const express = require('express');
const { validateBody } = require('../../middleware/validate');
const { requireAuth } = require('../../middleware/auth');
const { loginLimiter, registerLimiter } = require('../../middleware/rateLimiter');
const controller = require('./auth.controller');
const v = require('./auth.validators');

const router = express.Router();

router.post('/register', registerLimiter, validateBody(v.registerSchema), controller.register);
router.post('/verify-otp', validateBody(v.verifyOtpSchema), controller.verifyOtp);
router.post('/login', loginLimiter, validateBody(v.loginSchema), controller.login);
router.post('/refresh', validateBody(v.refreshTokenSchema), controller.refresh);
router.post('/forgot-password', validateBody(v.forgotPasswordSchema), controller.forgotPassword);
router.post('/reset-password', validateBody(v.resetPasswordSchema), controller.resetPassword);
router.post('/logout', requireAuth, controller.logout);
router.get('/me', requireAuth, controller.me);

module.exports = router;
