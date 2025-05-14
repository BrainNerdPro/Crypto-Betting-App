const express = require('express');
const router = express.Router();

const { verifyToken, requireAdmin } = require("../middleware/auth");
const { setDailyLine, getAllBets } = require('../controllers/adminController');
const { resolveBet } = require('../controllers/resolveBetController');
const { getAllUsers } = require('../controllers/adminController');

// Set daily line
router.post('/admin/set-line',  verifyToken, requireAdmin, setDailyLine);

// ✅ Get all bets for today
router.get('/admin/bets',  verifyToken, requireAdmin, getAllBets);

// Resolve bet
router.post('/resolve-bet',  verifyToken, requireAdmin, resolveBet);

// Get all users
router.get('/admin/users',  verifyToken, requireAdmin, getAllUsers);

// Change password
router.post("/admin/change-password", adminController.changePassword);


module.exports = router;
