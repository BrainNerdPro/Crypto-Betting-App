// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');



router.get('/withdrawals/:username', verifyToken, userController.getUserWithdrawals);

router.get('/user/balance/:username', verifyToken, userController.getBalance);

router.post('/login', userController.loginRateLimiter, userController.loginUser);

module.exports = router;
