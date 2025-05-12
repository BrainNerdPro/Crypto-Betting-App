const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const connectDB = require("./config/db");

const app = express();

console.log("🟢 Backend server initializing...");

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000", // fallback for local dev
  credentials: true
}));

app.use((req, res, next) => {
  console.log("Origin:", req.headers.origin);
  next();
});

app.use(express.json());

// ✅ Step 1: create HTTP server
const http = require("http");
const server = http.createServer(app);

// ✅ Step 2: initialize socket.io
const { initSocketIO } = require("./socket");
const io = initSocketIO(server);
app.set("io", io);

connectDB().catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
  });

// Models
const Bet = require('./models/Bet');
const DailyLine = require("./models/DailyLine");

// ✅ Setup socket.io connection
io.on("connection", async (socket) => {
  console.log("🔌 A client connected:", socket.id);

  socket.on("register_username", (username) => {
    socket.join(username);
    console.log(`📥 ${username} joined their personal room`);
  });

  try {
    const today = new Date().toISOString().slice(0, 10);
    const dailyLine = await DailyLine.findOne({ _id: today });

    if (!dailyLine) {
      console.warn(`⚠️ No daily line for ${today}`);
      socket.emit("bet_volume_error", { message: "No betting line for today" });
      return;
    }

    const bets = await Bet.find({ line_id: today });

    const yes_total = bets.filter(b => b.choice === 'YES').reduce((sum, b) => sum + b.amount, 0);
    const no_total = bets.filter(b => b.choice === 'NO').reduce((sum, b) => sum + b.amount, 0);
    const total = yes_total + no_total;
    const yes_percent = total > 0 ? Math.round((yes_total / total) * 100) : 0;
    const no_percent = 100 - yes_percent;

    socket.emit("bet_volume_updated", {
      yes_total,
      no_total,
      total,
      yes_percent,
      no_percent,
      line_id: today,
    });

  } catch (err) {
    console.error("❌ Error during socket bet volume fetch:", err.message);
    socket.emit("bet_volume_error", { message: "Server error" });
  }
});


// ✅ Watch bets in MongoDB and emit totals
const watchBets = () => {
  const changeStream = Bet.watch();

  changeStream.on("change", async (change) => {
    if (change.operationType === "insert") {
        const today = new Date().toISOString().slice(0, 10);
        const bets = await Bet.find({ line_id: today });
        
        const yes_total = bets.filter(b => b.choice === 'YES').reduce((sum, b) => sum + b.amount, 0);
        const no_total = bets.filter(b => b.choice === 'NO').reduce((sum, b) => sum + b.amount, 0);
        const total = yes_total + no_total;
        const yes_percent = total > 0 ? Math.round((yes_total / total) * 100) : 0;
        const no_percent = 100 - yes_percent;
        
        io.emit("bet_volume_updated", { yes_total, no_total, total, yes_percent, no_percent });
        

      console.log("📈 Real-time bet volume broadcasted");
    }
  });

  console.log("✅ Watching bets for real-time updates...");
};
watchBets();

// Routes
const dailyLineRoutes = require('./routes/dailyLineRoutes')(io);
app.use('/api', dailyLineRoutes);
app.use('/api', require('./routes/betVolumeRoutes'));
app.use('/api', require('./routes/adminRoutes'));
app.use('/api', require('./routes/userRoutes'));
app.use('/api', require('./routes/withdrawRoutes'));
app.use('/api', require('./routes/adminWithdrawalRoutes'));
app.use("/api", require("./routes/verifyDepositRoutes"));
app.use("/api", require("./routes/depositAddressRoutes"));



// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Export io if needed elsewhere
module.exports.io = io;