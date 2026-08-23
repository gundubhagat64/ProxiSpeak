require("dotenv").config();

const connectDB = require("./config/db");
const User = require("./models/User");

const seedUsers = async () => {
  try {
    await connectDB();

    await User.deleteMany({
      userId: { $in: ["test-user", "near-user-1", "near-user-2", "far-user"] }
    });

    const users = [
      {
        socketId: "socket1",
        userId: "test-user",
        name: "Test User",
        position: { x: 400, y: 300 },
        location: {
          type: "Point",
          coordinates: [75.004, 26.003]
        },
        isOnline: true
      },
      {
        socketId: "socket2",
        userId: "near-user-1",
        name: "Near User 1",
        position: { x: 450, y: 300 },
        location: {
          type: "Point",
          coordinates: [75.0045, 26.003]
        },
        isOnline: true
      },
      {
        socketId: "socket3",
        userId: "near-user-2",
        name: "Near User 2",
        position: { x: 490, y: 300 },
        location: {
          type: "Point",
          coordinates: [75.0049, 26.003]
        },
        isOnline: true
      },
      {
        socketId: "socket4",
        userId: "far-user",
        name: "Far User",
        position: { x: 520, y: 300 },
        location: {
          type: "Point",
          coordinates: [75.0052, 26.003]
        },
        isOnline: true
      }
    ];

    await User.insertMany(users);

    console.log("Test users inserted successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
};

seedUsers();