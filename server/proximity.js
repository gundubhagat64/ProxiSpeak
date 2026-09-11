const User = require("./models/User");

const PIXELS_PER_DEGREE = 100000;
const BASE_LONGITUDE = 75;
const BASE_LATITUDE = 26;

function pixelToGeo(x, y) {
  const longitude = BASE_LONGITUDE + x / PIXELS_PER_DEGREE;
  const latitude = BASE_LATITUDE + y / PIXELS_PER_DEGREE;

  return [longitude, latitude];
}

function geoToPixel(longitude, latitude) {
  const x = (longitude - BASE_LONGITUDE) * PIXELS_PER_DEGREE;
  const y = (latitude - BASE_LATITUDE) * PIXELS_PER_DEGREE;

  return { x, y };
}

async function findNearbyUsers(userId, x, y, radius = 100) {
  const [longitude, latitude] = pixelToGeo(x, y);

  // Convert our pixel distance to meters.
  const radiusInMeters =
    (radius / PIXELS_PER_DEGREE) * 111320;

  const nearbyUsers = await User.find({
    userId: { $ne: userId },
    isOnline: true,
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: radiusInMeters,
      },
    },
  }).select("userId name position location socketId");

  return nearbyUsers;
}

async function findUsersInsideArea(minX, minY, maxX, maxY) {
  const [minLongitude, minLatitude] = pixelToGeo(minX, minY);
  const [maxLongitude, maxLatitude] = pixelToGeo(maxX, maxY);

  const users = await User.find({
    isOnline: true,
    location: {
      $geoWithin: {
        $box: [
          [minLongitude, minLatitude],
          [maxLongitude, maxLatitude],
        ],
      },
    },
  }).select("userId name position location socketId");

  return users;
}

module.exports = {
  pixelToGeo,
  geoToPixel,
  findNearbyUsers,
  findUsersInsideArea,
};