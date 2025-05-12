// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { loginUser } = require('../controllers/userController');
const { getBalance } = require('../controllers/userController');
const { getUserWithdrawals } = require('../controllers/userController');



router.get('/withdrawals/:username', getUserWithdrawals);

router.get('/user/balance/:username', getBalance);

router.post('/login', loginUser);

module.exports = router;
