const DailyLine = require('../models/DailyLine');
const Bet = require('../models/Bet');
const User = require('../models/User');
const { getIO, getUserSocketId } = require('../socket');

exports.resolveBet = async (req, res) => {
  const { date, winning_side } = req.body;

  if (!date || !['YES', 'NO'].includes(winning_side)) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  try {
    const line = await DailyLine.findOne({ _id: date });
    if (!line) {
      return res.status(404).json({ error: 'Line not found for this date' });
    }

    if (line.winning_side) {
      return res.status(400).json({ error: 'Line already resolved' });
    }

    line.winning_side = winning_side;
    await line.save();

    const bets = await Bet.find({ line_id: date, choice: winning_side });

    const convertOddsToMultiplier = (oddsStr) => {
      const odds = parseInt(oddsStr);
      if (isNaN(odds)) return 1;
      return odds > 0 ? (odds / 100 + 1) : (100 / Math.abs(odds) + 1);
    };

    const winning_odds = winning_side === 'YES' ? line.yes_odds : line.no_odds;
    const multiplier = convertOddsToMultiplier(winning_odds);

    for (const bet of bets) {
      const user = await User.findOne({ username: bet.username });
      if (user) {
        // user.balance += Math.round(bet.amount * multiplier);
        const gain = +(bet.amount * multiplier).toFixed(5); // Ensures proper rounding and converts to number
        user.balance = +(user.balance + gain).toFixed(5);   // Rounds final balance to 5 decimals
        console.log('betAmount: ', bet.amount);
        console.log('multiplier: ', multiplier);
        console.log('balance: ', user.balance);
        await user.save();
        const socketId = getUserSocketId(user.username);
        if (socketId) {
          getIO().to(socketId).emit('balance_updated', { balance: user.balance });
        }
      }
    }

    getIO().emit('daily_line_resolved', line);
    res.json({ message: 'Bet resolved successfully', winning_side });
  } catch (err) {
    console.error('❌ resolveBetController.js error:', err.message, err.stack);
    res.status(500).json({ error: 'Server error' });
  }
};