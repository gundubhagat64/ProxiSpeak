const User = require("./models/User");

const findNearbyUsers = async (userId, x, y, radius = 100) => {
  try {
    const scale = 10;

    const nearbyUsers = await User.find({
      userId: { $ne: userId },
      isOnline: true,
      location: {
        $near: [x / scale, y / scale],
        $maxDistance: radius / scale
      }
    }).select("-_id userId name position location");

    return nearbyUsers;
  } catch (error) {
    console.error("Proximity query error:", error.message);
    return [];
  }
};

module.exports = { findNearbyUsers };