const express = require("express");
const User = require("../models/User");

const router = express.Router();

router.get("/online", async (req, res) => {
  try {
    const users = await User.find(
      { isOnline: true },
      {
        _id: 0,
        userId: 1,
        name: 1,
        position: 1
      }
    );

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve online users"
    });
  }
});

module.exports = router;