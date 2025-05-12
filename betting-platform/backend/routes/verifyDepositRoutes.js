const express = require("express");
const router = express.Router();
const { verifyDeposit } = require("../controllers/depositController");

router.post("/verify-deposit", verifyDeposit);

module.exports = router;
