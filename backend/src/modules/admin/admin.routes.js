const express = require('express');
const { requireRole } = require('../../middleware/auth');
const controller = require('./admin.controller');

const router = express.Router();

router.get('/domains', requireRole('ADMIN'), controller.getDomains);
router.post('/domains', requireRole('ADMIN'), controller.addDomain);
router.delete('/domains/:id', requireRole('ADMIN'), controller.removeDomain);

module.exports = router;
