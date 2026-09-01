require("dotenv").config();

const connectDB = require("./config/db");
const { findNearbyUsers } = require("./proximity");

// Test function to check the proximity query functionality

const test = async () => {
  try {
    await connectDB();

    console.log("Testing MongoDB proximity query...");

    const users = await findNearbyUsers(
      "test-user",
      400,
      300,
      100
    );

    console.log("Nearby users:");

    users.forEach((user) => {
      console.log({
        userId: user.userId,
        name: user.name,
        position: user.position,
        location: user.location
      });
    });

    console.log(`Total nearby users: ${users.length}`);

    process.exit(0);
  } catch (error) {
    console.error("Proximity test failed:", error);
    process.exit(1);
  }
};

test();