const express = require('express');
const { requireRole } = require('../../middleware/auth');
const { validateBody } = require('../../middleware/validate');
const controller = require('./admin.controller');
const v = require('./admin.validators');

const router = express.Router();

// Require ADMIN role for all routes in this router
router.use(requireRole('ADMIN'));

// --- Analytics ---
router.get('/analytics/overview', controller.getOverview);
router.get('/analytics/charts', controller.getChartsData);

// --- Users (Students & Faculty) ---
router.get('/users/export', controller.exportUsersCSV);
router.get('/users', controller.listUsers);
router.post('/users', validateBody(v.createUserSchema), controller.createUser);
router.post('/users/bulk-import', validateBody(v.bulkImportSchema), controller.bulkImportUsers);
router.patch('/users/:id/role', validateBody(v.updateRoleSchema), controller.updateUserRole);
router.patch('/users/:id/status', validateBody(v.updateStatusSchema), controller.updateUserStatus);
router.patch('/users/:id', validateBody(v.updateUserSchema), controller.updateUser);
router.post('/users/:id/reset-password', validateBody(v.resetPasswordSchema), controller.resetUserPassword);
router.delete('/users/:id', controller.deleteUser);

// --- Code Bank / Problems ---
router.get('/problems', controller.listProblems);
router.post('/problems', validateBody(v.adminProblemSchema), controller.createProblem);
router.put('/problems/:id', validateBody(v.adminProblemSchema), controller.updateProblem);
router.patch('/problems/:id/toggle-publish', controller.togglePublishProblem);
router.delete('/problems/:id', controller.deleteProblem);

// Test Cases for problems
router.get('/problems/:id/testcases', controller.getTestCases);
router.post('/problems/:id/testcases', validateBody(v.adminTestCaseSchema), controller.addTestCase);
router.delete('/problems/:id/testcases/:tcId', controller.deleteTestCase);

// --- Contests & Assessments ---
router.get('/contests', controller.listContests);
router.post('/contests', validateBody(v.adminContestSchema), controller.createContest);
router.put('/contests/:id', validateBody(v.adminContestSchema), controller.updateContest);
router.delete('/contests/:id', controller.deleteContest);
router.get('/contests/:id/participants', controller.getContestParticipants);

// --- Domains ---
router.get('/domains', controller.getDomains);
router.post('/domains', controller.addDomain);
router.delete('/domains/:id', controller.removeDomain);

module.exports = router;
