const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require("../middleware/auth");
const { getWithdrawals, approveWithdrawal, rejectWithdrawal } = require('../controllers/withdrawalAdminController');

router.get('/admin/withdrawals',verifyToken, requireAdmin, getWithdrawals);
router.post('/admin/withdrawals/approve',verifyToken, requireAdmin, approveWithdrawal);
router.post('/admin/withdrawals/reject',verifyToken, requireAdmin, rejectWithdrawal);

module.exports = router;
