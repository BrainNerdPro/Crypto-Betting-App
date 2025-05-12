const express = require('express');
const router = express.Router();
const { getWithdrawals, approveWithdrawal, rejectWithdrawal } = require('../controllers/withdrawalAdminController');

router.get('/admin/withdrawals', getWithdrawals);
router.post('/admin/withdrawals/approve', approveWithdrawal);
router.post('/admin/withdrawals/reject', rejectWithdrawal);

module.exports = router;
