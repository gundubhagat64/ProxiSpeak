require("dotenv").config();

const connectDB = require("./config/db");
const { findNearbyUsers } = require("./proximity");

// Test function to check the proximity query functionality

const test = async () => {
  try {
    await connectDB();

    console.log("=== Proximity Testing Started ===");

    // Test 1: Normal proximity query
    console.log("\nTest 1: Normal query");

    const users = await findNearbyUsers(
      "test-user",
      400,
      300,
      100
    );

    console.log("Nearby users:", users.length);

    users.forEach((user) => {
      console.log({
        userId: user.userId,
        name: user.name,
        position: user.position,
        location: user.location
      });
    });

    // Test 2: Small radius
    console.log("\nTest 2: Small radius");

    const nearbySmallRadius = await findNearbyUsers(
      "test-user",
      400,
      300,
      30
    );

    console.log(
      "Users within 30px:",
      nearbySmallRadius.length
    );

    // Test 3: Large radius
    console.log("\nTest 3: Large radius");

    const nearbyLargeRadius = await findNearbyUsers(
      "test-user",
      400,
      300,
      200
    );

    console.log(
      "Users within 200px:",
      nearbyLargeRadius.length
    );

    console.log("\n=== Proximity Testing Completed ===");

    process.exit(0);
  } catch (error) {
    console.error("Proximity test failed:", error);
    process.exit(1);
  }
};

test();