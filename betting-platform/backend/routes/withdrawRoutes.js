const express = require('express');
const router = express.Router();
const { requestWithdrawal } = require('../controllers/withdrawController');
const { cancelWithdrawal } = require('../controllers/withdrawController');

router.post('/withdraw', requestWithdrawal);
router.post("/withdrawals/cancel", cancelWithdrawal);


module.exports = router;
