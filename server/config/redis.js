const { createClient } = require("redis");

const redisUrl =
  process.env.REDIS_URL || "redis://localhost:6379";

const pubClient = createClient({
  url: redisUrl
});

const subClient = pubClient.duplicate();

pubClient.on("error", (error) => {
  console.error("Redis Publisher Error:", error.message);
});

subClient.on("error", (error) => {
  console.error("Redis Subscriber Error:", error.message);
});

const connectRedis = async () => {
  await pubClient.connect();
  await subClient.connect();

  console.log("Redis connected");
};

module.exports = {
  pubClient,
  subClient,
  connectRedis
};