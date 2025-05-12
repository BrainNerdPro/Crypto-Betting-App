const mongoose = require("mongoose");

const txidSchema = new mongoose.Schema({
  username: { type: String, required: true },
  txid: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  confirmed: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Txid", txidSchema);
