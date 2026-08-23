const User = require("./models/User");

const PIXELS_PER_DEGREE = 100000;

const pixelToGeo = (x, y) => {
  const longitude = 75 + x / PIXELS_PER_DEGREE;
  const latitude = 26 + y / PIXELS_PER_DEGREE;

  return [longitude, latitude];
};

const findNearbyUsers = async (userId, x, y, radius = 100) => {
  try {
    const coordinates = pixelToGeo(x, y);

    // Approximately 1 degree latitude = 111,320 meters.
    // Our coordinate system uses 100,000 pixels per degree.
    const metersPerPixel = 111320 / PIXELS_PER_DEGREE;

    const maxDistance = radius * metersPerPixel;

    const nearbyUsers = await User.find({
      userId: { $ne: userId },
      isOnline: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates
          },
          $maxDistance: maxDistance
        }
      }
    }).select("userId name position location");

    return nearbyUsers;
  } catch (error) {
    console.error("Proximity query error:", error.message);
    return [];
  }
};

module.exports = {
  findNearbyUsers,
  pixelToGeo
};