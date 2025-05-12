const Bet = require('../models/Bet');
const DailyLine = require('../models/DailyLine');

exports.getBetVolume = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const dailyLine = await DailyLine.findOne({ _id: today });

    if (!dailyLine) {
      return res.status(404).json({ error: 'No daily line for today' });
    }

    const bets = await Bet.find({ line_id: dailyLine._id });

    const totalAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);

    res.json({
      total_bets: bets.length,
      total_amount: totalAmount,
    });
  } catch (err) {
    console.error("❌ getBetVolume failed:", err.message);
    res.status(500).json({ error: 'Server error' });
  }
};
