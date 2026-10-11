const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { validateBody } = require('../../middleware/validate');
const controller = require('./aptitude.controller');
const v = require('./aptitude.validators');

const router = express.Router();

// Every aptitude route needs a logged-in user.
router.use(requireAuth);

// ── Practice tests (student view) ──
router.get('/overview', controller.overview);
router.post('/tests', validateBody(v.startTestSchema), controller.startTest);
router.get('/tests/:id', controller.getTest);
router.post('/tests/:id/submit', validateBody(v.submitTestSchema), controller.submitTest);
router.get('/tests/:id/result', controller.getResult);

// ── Question bank (trainer / admin) ──
router.get('/questions', requireRole('TRAINER', 'ADMIN'), controller.listQuestions);
router.post('/questions', requireRole('TRAINER', 'ADMIN'), validateBody(v.questionSchema), controller.createQuestion);
router.post('/questions/bulk', requireRole('TRAINER', 'ADMIN'), validateBody(v.bulkQuestionsSchema), controller.bulkCreate);
router.put('/questions/:id', requireRole('TRAINER', 'ADMIN'), validateBody(v.questionSchema), controller.updateQuestion);
router.delete('/questions/:id', requireRole('TRAINER', 'ADMIN'), controller.removeQuestion);

module.exports = router;
