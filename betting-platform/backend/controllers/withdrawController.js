const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');
const Decimal = require("decimal.js");

exports.requestWithdrawal = async (req, res) => {
  const { username, wallet_address, amount } = req.body;

  if (!wallet_address.match(/^0x[a-fA-F0-9]{40}$/)) {
    return res.status(400).json({ error: 'Invalid wallet address format' });
  }
  
  if (amount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than zero' });
  }
  
  if (!username || !wallet_address || !amount) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const userBalance = new Decimal(user.balance);
    const dec_amount = new Decimal(amount);
    user.balance = userBalance.minus(dec_amount).toNumber();
    //user.balance -= amount;
    await user.save();

    const request = await Withdrawal.create({
      username,
      wallet_address,
      amount,
      status: 'pending',
    });
    
    // 🚀 Emit socket event
    req.app.get('io').emit('withdrawal:update');

    res.json({ message: 'Withdrawal request submitted', request, balance: user.balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.cancelWithdrawal = async (req, res) => {
    const { id } = req.body;
    console.log("🛑 Cancel attempt for ID:", id);
    if (!id) return res.status(400).json({ error: "ID is required" });
  
    try {
      const withdrawal = await Withdrawal.findById(id);
      if (!withdrawal) {        
        console.log("❌ Withdrawal not found");
        return res.status(404).json({ error: "Not found" });
      }
      if (withdrawal.status !== "pending") {
        console.log("❌ Withdrawal already processed");
        return res.status(400).json({ error: "Already processed" });
      }
  
      withdrawal.status = "cancelled";
      await withdrawal.save();
  
      const user = await User.findOne({ username: withdrawal.username });
      if (user) {
        user.balance += withdrawal.amount;
        await user.save();
      }  
      
    console.log("✅ Withdrawal cancelled and refunded");
      res.json({ message: "Withdrawal cancelled and refunded" });
    } catch (err) {
      console.error("❌ Server error:", err);        
      res.status(500).json({ error: "Failed to cancel withdrawal" });
    }
  };
  
