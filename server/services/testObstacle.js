const {
  calculateSpatialAudio,
  pathIntersectsObstacle
} = require("./services/obstacleService");

const userA = {
  x: 300,
  y: 300
};

const userB = {
  x: 350,
  y: 300
};

const wall = {
  type: "wall",
  x: 325,
  y: 250,
  width: 20,
  height: 100,
  blocksSound: true,
  soundAttenuation: 1
};

console.log("================================");
console.log("ProxiSpeak Week 4 Test");
console.log("================================");

console.log(
  "Wall intersection:",
  pathIntersectsObstacle(
    userA,
    userB,
    wall
  )
);

const result =
  calculateSpatialAudio(
    userA,
    userB,
    [wall],
    100
  );

console.log(
  JSON.stringify(
    result,
    null,
    2
  )
);

console.log("================================");