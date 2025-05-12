const axios = require("axios");
const User = require("../models/User");
const Txid = require("../models/Txid");

exports.verifyDeposit = async (req, res) => {
  const { username, txid, senderAddress } = req.body;

  if (!username || !txid || !senderAddress) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    // 1. Check if already processed
    const exists = await Txid.findOne({ txid });
    if (exists) return res.status(400).json({ error: "TXID already used" });

    // 2. Check tx on blockchain
    const response = await axios.get(`https://api.etherscan.io/api`, {
      params: {
        module: "proxy",
        action: "eth_getTransactionByHash",
        txhash: txid,
        apikey: process.env.ETHERSCAN_API_KEY,
      },
    });

    const tx = response.data.result;

    if (!tx) return res.status(400).json({ error: "TX not found" });

    const toAddress = tx.to.toLowerCase();
    const fromAddress = tx.from.toLowerCase();
    const expectedAddress = process.env.PLATFORM_WALLET.toLowerCase();

    if (toAddress !== expectedAddress) {
      return res.status(400).json({ error: "TX did not go to the platform address" });
    }

    if (fromAddress !== senderAddress.toLowerCase()) {
      return res.status(400).json({ error: "Sender address mismatch" });
    }

    // optional: check confirmations
    // optional: check value >= MIN_AMOUNT

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const ethAmount = parseInt(tx.value, 16) / 1e18;

    // 3. Credit user
    user.balance += ethAmount;
    await user.save();

    // 4. Save TXID
    await Txid.create({ username, txid, amount: ethAmount, confirmed: true });

    // 5. Notify frontend
    req.app.get("io").to(username).emit("balance_updated", {
      balance: user.balance,
    });

    res.json({ message: "Deposit verified", newBalance: user.balance });
  } catch (err) {
    console.error("❌ Error verifying deposit:", err);
    res.status(500).json({ error: "Failed to verify deposit" });
  }
};
