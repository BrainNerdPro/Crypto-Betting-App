const DailyLine = require('../models/DailyLine');
const Bet = require('../models/Bet');
const User = require('../models/User')

const Decimal = require("decimal.js");


exports.getDailyLine = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const line = await DailyLine.findOne({ _id: today });
    if (!line) return res.status(404).json({ error: 'No line set for today' });
    res.json(line);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.placeBet = (io) => async (req, res) => {
  const { username, choice, amount } = req.body;

  if (!username || !choice || !amount) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user || user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance or user not found' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const line = await DailyLine.findOne({ _id: today });

    if (!line || new Date() > new Date(line.cutoff_time)) {
      return res.status(400).json({ error: 'Betting is closed for today' });
    }

    // user.balance -= amount;
    const userBalance = new Decimal(user.balance);
    const dec_amount = new Decimal(amount);
    user.balance = userBalance.minus(dec_amount).toNumber();
    await user.save();

    const bet = await Bet.create({
      username,
      choice,
      amount,
      timestamp: new Date(),
      line_id: today,
    });

    const bets = await Bet.find({ line_id: today });

    const yes_total = bets
      .filter((b) => b.choice === 'YES')
      .reduce((sum, b) => sum + b.amount, 0);

    const no_total = bets
      .filter((b) => b.choice === 'NO')
      .reduce((sum, b) => sum + b.amount, 0);

    const total = yes_total + no_total;
    const yes_percent = total > 0 ? Math.round((yes_total / total) * 100) : 0;
    const no_percent = 100 - yes_percent;

    io.emit('bet_volume_updated', {
      yes_total,
      no_total,
      total,
      yes_percent,
      no_percent,
    });

    res.json({ message: 'Bet placed successfully', balance: user.balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
