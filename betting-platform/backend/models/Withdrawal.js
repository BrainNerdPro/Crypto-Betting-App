const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  username: { type: String, required: true },
  wallet_address: { type: String, required: true },
  amount: { type: Number, required: true },
//  status: { type: String, default: 'pending' },
   status: { type: String, enum: ['pending', 'completed', 'rejected'], default: 'pending' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
