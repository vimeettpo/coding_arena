const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { validateBody } = require('../../middleware/validate');
const controller = require('./quiz.controller');
const v = require('./quiz.validators');

const router = express.Router();

router.get('/', controller.list);
router.get('/:id', controller.getDetail);
router.get('/:id/leaderboard', controller.leaderboard);
router.post('/', requireAuth, requireRole('TRAINER', 'ADMIN'), validateBody(v.createQuizSchema), controller.create);
router.post('/:id/submit', requireAuth, validateBody(v.submitQuizSchema), controller.submit);
router.get('/:id/result', requireAuth, controller.getResult);
router.delete('/:id', requireAuth, requireRole('TRAINER', 'ADMIN'), controller.remove);

module.exports = router;
