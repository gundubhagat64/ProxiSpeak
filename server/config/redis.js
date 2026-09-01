const { createClient } = require("redis");

const redisUrl = process.env.REDIS_URL;

const pubClient = createClient({
  url: redisUrl,
});

const subClient = pubClient.duplicate();

pubClient.on("error", (error) => {
  console.error("Redis Publisher Error:", error.message);
});

subClient.on("error", (error) => {
  console.error("Redis Subscriber Error:", error.message);
});

const connectRedis = async () => {
  try {
    await pubClient.connect();
    await subClient.connect();

    console.log("Redis connected");
    return true;
  } catch (error) {
    console.error("Redis unavailable:", error.message);
    return false;
  }
};

module.exports = {
  pubClient,
  subClient,
  connectRedis
};