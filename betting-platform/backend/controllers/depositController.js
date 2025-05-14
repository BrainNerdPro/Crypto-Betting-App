const axios = require("axios");
const User = require("../models/User");
const Txid = require("../models/Txid");
const SenderRecord = require("../models/SenderRecord");

exports.verifyDeposit = async (req, res) => {
  const { username, txid, senderAddress } = req.body;

  if (!username || !txid || !senderAddress) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const exists = await Txid.findOne({ txid });
    if (exists) return res.status(400).json({ error: "TXID already used" });

    const senderRecord = await SenderRecord.findOne({ username, senderAddress });
    if (!senderRecord) {
      return res.status(400).json({ error: "Sender address not registered before deposit" });
    }

    const txRes = await axios.get(`https://api.etherscan.io/api`, {
      params: {
        module: "proxy",
        action: "eth_getTransactionByHash",
        txhash: txid,
        apikey: process.env.ETHERSCAN_API_KEY,
      },
    });

    const tx = txRes.data.result;
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

    const blockRes = await axios.get(`https://api.etherscan.io/api`, {
      params: {
        module: "proxy",
        action: "eth_getBlockByNumber",
        tag: tx.blockNumber,
        boolean: true,
        apikey: process.env.ETHERSCAN_API_KEY,
      },
    });

    const txTimestamp = parseInt(blockRes.data.result.timestamp, 16) * 1000;
    const registeredTimestamp = new Date(senderRecord.submittedAt).getTime();

    if (registeredTimestamp > txTimestamp) {
      return res.status(400).json({
        error: " Timestamp mismatch: You registered this address *after* sending ETH. Deposit rejected.",
      });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const ethAmount = parseInt(tx.value, 16) / 1e18;
    user.balance += ethAmount;
    await user.save();

    await Txid.create({ username, txid, amount: ethAmount, confirmed: true });

    req.app.get("io").to(username).emit("balance_updated", {
      balance: user.balance,
    });

    res.json({ message: " Deposit verified successfully", newBalance: user.balance });
  } catch (err) {
    console.error(" Error verifying deposit:", err);
    res.status(500).json({ error: "Server error during deposit verification" });
  }
};

exports.registerSender = async (req, res) => {
  const { username, senderAddress, submittedAt } = req.body;
    console.log("Registering sender:", { username, senderAddress, submittedAt });

  if (!username || !senderAddress || !submittedAt) {
    return res.status(400).json({ success: false, error: "Missing fields" });
  }

  try {
    await SenderRecord.findOneAndUpdate(
      { username, senderAddress },
      { $set: { submittedAt } },
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Register sender error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
