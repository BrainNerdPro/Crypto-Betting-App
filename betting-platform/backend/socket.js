const { Server } = require("socket.io");

let userSocketMap = {};
let io;

function initSocketIO(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);

    socket.on("register_username", (username) => {
      userSocketMap[username] = socket.id;
      console.log("📌 Registered:", username, socket.id);
    });

    socket.on("disconnect", () => {
      for (const [user, id] of Object.entries(userSocketMap)) {
        if (id === socket.id) delete userSocketMap[user];
      }
    });
  });

  return io;
}

function getUserSocketId(username) {
  console.log("🔎 Looking up socket ID for", username);
  return userSocketMap[username];
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized yet");
  }
  return io;
}

module.exports = {
  initSocketIO,
  getUserSocketId,
  getIO // ✅ now works correctly
};
