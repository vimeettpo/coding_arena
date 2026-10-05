const express = require('express');
const controller = require('./leaderboard.controller');

const router = express.Router();
router.get('/', controller.getLeaderboard);

module.exports = router;
