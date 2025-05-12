const express = require('express');
const router = express.Router();
const dailyLineController = require('../controllers/dailyLineController');

module.exports = (io) => {
    router.get('/daily-line', dailyLineController.getDailyLine);
    router.post('/place-bet', dailyLineController.placeBet(io));
    return router;
  };
