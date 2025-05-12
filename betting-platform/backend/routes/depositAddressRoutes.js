const express = require("express");
const router = express.Router();

router.get("/deposit-address", (req, res) => {
  const address = process.env.PLATFORM_WALLET;
  if (!address) return res.status(500).json({ error: "Wallet address not set" });
  res.json({ address });
});

module.exports = router;
