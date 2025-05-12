const User = require('../models/User');

exports.getAllUsers = async (req, res) => {
    try {
      const users = await User.find({}, "username balance created_at").sort({ balance: -1 });
      res.json(users);
    } catch (err) {
      console.error("❌ Failed to fetch users:", err);
      res.status(500).json({ error: "Failed to fetch user data" });
    }
  };