require("dotenv").config({ path: "./server/.env"});

const connectDB = require("./config/db");
const { findNearbyUsers } = require("./proximity");

const test = async () => {
  await connectDB();

  const users = await findNearbyUsers(
    "test-user",
    400,
    300,
    100
  );

  console.log("Nearby users:", users);

  process.exit(0);
};

test();