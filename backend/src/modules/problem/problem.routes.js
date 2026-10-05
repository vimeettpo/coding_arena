const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { validateBody } = require('../../middleware/validate');
const controller = require('./problem.controller');
const v = require('./problem.validators');

const router = express.Router();

// NOTE: SecurityConfig.java requires auth on all of /api/problems/**.
router.post('/compile', validateBody(v.compileSchema), controller.compile);
router.get('/', requireAuth, controller.list);
router.get('/:slug', requireAuth, controller.detail);
router.post('/:slug/run', requireAuth, validateBody(v.runSchema), controller.run);
router.post('/:slug/submit', requireAuth, validateBody(v.submitSchema), controller.submit);
router.get('/:slug/submissions', requireAuth, controller.submissions);
router.post('/', requireAuth, requireRole('TRAINER', 'ADMIN'), validateBody(v.createProblemSchema), controller.create);

module.exports = router;
