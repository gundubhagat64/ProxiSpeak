const { createClient } = require("redis");

let pubClient = null;
let subClient = null;

const connectRedis = async () => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.log("Redis URL not configured - running without Redis");

    return {
      pubClient: null,
      subClient: null,
    };
  }

  try {
    pubClient = createClient({
      url: redisUrl,
    });

    subClient = pubClient.duplicate();

    pubClient.on("error", (error) => {
      console.error("Redis Publisher Error:", error.message);
    });

    subClient.on("error", (error) => {
      console.error("Redis Subscriber Error:", error.message);
    });

    await Promise.all([
      pubClient.connect(),
      subClient.connect(),
    ]);

    console.log("Redis connected successfully");

    return {
      pubClient,
      subClient,
    };
  } catch (error) {
    console.error("Redis connection failed:", error.message);

    return {
      pubClient: null,
      subClient: null,
    };
  }
};

module.exports = {
  connectRedis,
};