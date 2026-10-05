const express = require('express');
const { requireRole } = require('../../middleware/auth');
const controller = require('./user.controller');

const router = express.Router();

router.get('/student-dashboard', requireRole('STUDENT', 'TRAINER', 'ADMIN'), controller.studentDashboard);
router.get('/students', requireRole('TRAINER', 'ADMIN'), controller.getStudents);

module.exports = router;
