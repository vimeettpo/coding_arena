const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { validateBody } = require('../../middleware/validate');
const controller = require('./contest.controller');
const v = require('./contest.validators');

const router = express.Router();

router.get('/dashboard', requireAuth, requireRole('TRAINER', 'ADMIN'), controller.dashboard);
router.get('/', controller.list);
router.get('/:id', controller.detail);
router.get('/:id/leaderboard', controller.leaderboard);
router.post('/:id/register', requireAuth, controller.register);
router.post('/', requireAuth, requireRole('TRAINER', 'ADMIN'), validateBody(v.createContestSchema), controller.create);

module.exports = router;
