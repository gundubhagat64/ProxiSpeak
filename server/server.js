require("dotenv").config();
const { connectRedis } = require("./config/redis");
const { createAdapter } = require("@socket.io/redis-adapter");

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const {
  pubClient,
  subClient,
  connectRedis
} = require("./config/redis");

const connectDB = require("./config/db");

const setupSocket = require("./socket/socketHandler");
const userRoutes = require("./routes/userRoutes");

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

// Redis adapter for multiple Socket.IO servers
io.adapter(createAdapter(pubClient, subClient));

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

setupSocket(io);

const startServer = async () => {
  try {
    await connectDB();

    const { pubClient, subClient } = await connectRedis();

    if (pubClient && subClient) {
      io.adapter(createAdapter(pubClient, subClient));
      console.log("Socket.IO Redis adapter enabled");
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

  const { pubClient, subClient } = await connectRedis();

  if (pubClient && subClient) {
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Socket.IO Redis adapter enabled");
  }

  server.listen(PORT, () => {
    console.log("--------------------------------------");
    console.log("ProxiSpeak backend started");
    console.log(`HTTP: http://localhost:${PORT}`);
    console.log(`Socket.IO: ws://localhost:${PORT}`);
    console.log(`Instance: ${process.env.INSTANCE_ID || "server-1"}`);
    console.log("--------------------------------------");
  });
};

startServer();