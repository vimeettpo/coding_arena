const ApiResponse = require('../../common/ApiResponse');
const authService = require('./auth.service');
const userService = require('../user/user.service');

async function register(req, res) {
  await authService.register(req.body);
  res.json(ApiResponse.message('Account created. Check your email for a verification code.'));
}

async function verifyOtp(req, res) {
  await authService.verifyOtp(req.body);
  res.json(ApiResponse.message('Email verified successfully.'));
}

async function login(req, res) {
  const data = await authService.login(req.body);
  res.json(ApiResponse.ok(data));
}

async function refresh(req, res) {
  const data = await authService.refresh(req.body);
  res.json(ApiResponse.ok(data));
}

async function forgotPassword(req, res) {
  await authService.forgotPassword(req.body);
  res.json(ApiResponse.message('If that email exists, a reset code has been sent.'));
}

async function resetPassword(req, res) {
  await authService.resetPassword(req.body);
  res.json(ApiResponse.message('Password reset. Please sign in again.'));
}

async function logout(req, res) {
  await authService.logout(req.principal.id);
  res.json(ApiResponse.message('Signed out.'));
}

async function me(req, res) {
  const user = await userService.getById(req.principal.id);
  res.json(ApiResponse.ok(userService.toResponse(user)));
}

module.exports = { register, verifyOtp, login, refresh, forgotPassword, resetPassword, logout, me };
