require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");

const connectDB = require("./config/db");

const {
  pubClient,
  subClient,
  connectRedis
} = require("./config/redis");

const setupSocket = require("./socket/socketHandler");
const userRoutes = require("./routes/userRoutes");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: true,
  credentials: true,
};

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// Redis adapter for multiple Socket.IO servers
io.adapter(createAdapter(pubClient, subClient));

app.use(cors(corsOptions));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: "ProxiSpeak",
    status: "online",
    service: "Real-time Geospatial Audio Backend",
  });
});

app.use("/api/users", userRoutes);

setupSocket(io);

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();

    server.listen(PORT, () => {
      console.log("--------------------------------------");
      console.log("ProxiSpeak backend started");
      console.log(`HTTP: http://localhost:${PORT}`);
      console.log(`Socket.IO: ws://localhost:${PORT}`);
      console.log("--------------------------------------");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();