const express = require('express');
const router = express.Router();
const { getBetVolume } = require('../controllers/betVolumeController');

router.get('/bet-volume', getBetVolume);

module.exports = router;