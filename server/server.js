require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");

const {
  connectRedis
} = require("./config/redis");

const connectDB = require("./config/db");

const setupSocket = require("./socket/socketHandler");
const userRoutes = require("./routes/userRoutes");
const roomRoutes = require("./routes/roomRoutes");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// CORS configuration to allow requests from the frontend

const corsOptions = {
  origin: true,
  credentials: true,
};

// Initialize Socket.IO server with CORS settings

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

app.use(cors(corsOptions));
app.use(express.json());

// Define a simple route to check server status

app.get("/", (req, res) => {
  res.json({
    name: "ProxiSpeak",
    status: "online",
    service: "Real-time Geospatial Audio Backend",
  });
});

// Use user routes for handling user-related API endpoints

app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);

setupSocket(io);

const startServer = async () => {
  try {
    await connectDB();

    const { pubClient, subClient } = await connectRedis();

    if (pubClient && subClient) {
      io.adapter(createAdapter(pubClient, subClient));
      console.log("Socket.IO Redis adapter enabled");
    } else {
      console.log("Socket.IO running without Redis");
    }

    server.listen(PORT, () => {
      console.log("--------------------------------------");
      console.log("ProxiSpeak backend started");
      console.log(`HTTP: http://localhost:${PORT}`);
      console.log(`Socket.IO: ws://localhost:${PORT}`);
      console.log(
        `Instance: ${process.env.INSTANCE_ID || "server-1"}`
      );
      console.log("--------------------------------------");
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();