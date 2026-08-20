const User = require("./models/User");

const findNearbyUsers = async (userId, x, y, radius = 100) => {
  try {
    const scale = 100000;
    
    const longitude = 75 + x / scale;
    const latitude = 26 + y / scale;

    const nearbyUsers = await User.find({
      userId: { $ne: userId },
      isOnline: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude]
          },
          $maxDistance: radius
        }
      }
    }).select("userId name position location");

    return nearbyUsers;
  } catch (error) {
    console.error("Proximity query error:", error.message);
    return [];
  }
};

module.exports = { findNearbyUsers };