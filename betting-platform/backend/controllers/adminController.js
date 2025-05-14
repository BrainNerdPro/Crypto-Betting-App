const DailyLine = require('../models/DailyLine');
const Bet = require('../models/Bet');
const { getIO } = require('../socket');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.setDailyLine = async (req, res) => {
  const { question, yes_odds, no_odds, cutoff_time } = req.body;

  console.log("Setting daily line:", { question, yes_odds, no_odds, cutoff_time });

  if (!question || !yes_odds || !no_odds || !cutoff_time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const dateKey = cutoff_time.slice(0, 10); // YYYY-MM-DD
    const line = await DailyLine.findOneAndUpdate(
      { _id: dateKey },
      {
        _id: dateKey,
        question,
        yes_odds,
        no_odds,
        cutoff_time,
        is_active: true,
      },
      { upsert: true, new: true }
    );

    getIO().emit('daily_line_updated', line);
    res.json({ message: 'Daily line set successfully', line });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAllBets = async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const dailyLine = await DailyLine.findOne({ _id: today });
        if (!dailyLine) return res.status(404).json({ error: 'No daily line found' });
    
        const bets = await Bet.find({ line_id: today }).sort({ timestamp: -1 });
    
        const enrichedBets = bets.map((bet) => {
          let status = 'PENDING';
          if (dailyLine.winning_side) {
            status = bet.choice === dailyLine.winning_side ? 'WON' : 'LOST';
          }
    
          return {
            id: bet._id,
            username: bet.username,
            amount: bet.amount,
            side: bet.choice,
            status
          };
        });
    
        res.json(enrichedBets);
      } catch (err) {
        res.status(500).json({ error: 'Failed to fetch bets' });
      }
  };

 
exports.changePassword = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(userId);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getAllUsers = async (req, res) => {
    try {
      const users = await User.find({}, "username balance created_at").sort({ balance: -1 });
      res.json(users);
    } catch (err) {
      console.error("❌ Failed to fetch users:", err);
      res.status(500).json({ error: "Failed to fetch user data" });
    }
  };