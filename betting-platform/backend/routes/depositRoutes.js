const express = require("express");
const router = express.Router();
const { registerSender, verifyDeposit } = require("../controllers/depositController");

router.get("/deposit-address", (req, res) => {
  const address = process.env.PLATFORM_WALLET;
  if (!address) return res.status(500).json({ error: "Wallet address not set" });
  res.json({ address });
});

router.post("/register-sender", registerSender);
router.post("/verify-deposit", verifyDeposit);

module.exports = router;
