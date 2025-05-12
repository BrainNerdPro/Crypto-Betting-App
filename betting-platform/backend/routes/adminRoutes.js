const express = require('express');
const router = express.Router();

const { setDailyLine, getAllBets } = require('../controllers/adminController');
const { resolveBet } = require('../controllers/resolveBetController');
const { getAllUsers } = require('../controllers/adminUserController');

// Protect admin routes with token check
const checkAdminToken = (req, res, next) => {
  const token = req.headers['x-admin-token'];
  if (process.env.ADMIN_TOKEN && token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
};

// Set daily line
router.post('/admin/set-line', checkAdminToken, setDailyLine);

// ✅ Get all bets for today
router.get('/admin/bets', checkAdminToken, getAllBets);

// Resolve bet
router.post('/resolve-bet', checkAdminToken, resolveBet);

// Get all users
router.get('/admin/users', checkAdminToken, getAllUsers);

module.exports = router;
