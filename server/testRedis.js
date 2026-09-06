require("dotenv").config();

const { connectRedis } = require("./config/redis");

const testRedis = async () => {
  try {
    const { pubClient, subClient } = await connectRedis();

    if (!pubClient || !subClient) {
      console.log("Redis connection: FAIL");
      process.exit(1);
    }

    console.log("Redis connection: PASS");

    await subClient.subscribe(
      "proxispeak-test",
      (message) => {
        console.log("Received:", message);
      }
    );

    await pubClient.publish(
      "proxispeak-test",
      "Redis Pub/Sub working"
    );

    setTimeout(async () => {
      await subClient.unsubscribe("proxispeak-test");

      await pubClient.quit();
      await subClient.quit();

      console.log("Redis Pub/Sub test completed.");

      process.exit(0);
    }, 500);

  } catch (error) {
    console.error("Redis test: FAIL");
    console.error(error.message);

    process.exit(1);
  }
};

testRedis();