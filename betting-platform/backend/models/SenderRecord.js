const mongoose = require("mongoose");

const SenderRecordSchema = new mongoose.Schema({
  username: { type: String, required: true },
  senderAddress: { type: String, required: true },
  submittedAt: { type: Date, required: true }
});


// Optional: to prevent duplicate (username + senderAddress)
SenderRecordSchema.index({ username: 1, senderAddress: 1 }, { unique: true });

module.exports = mongoose.model("SenderRecord", SenderRecordSchema);
