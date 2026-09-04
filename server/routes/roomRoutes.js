const express = require("express");
const Room = require("../models/Room");

const router = express.Router();

// Create a new room
router.post("/", async (req, res) => {
  try {
    const room = new Room(req.body);

    const savedRoom = await room.save();

    res.status(201).json({
      success: true,
      room: savedRoom
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      message: "Unable to create room"
    });
  }
});

// Get a room by ID
router.get("/:id", async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    res.json({
      success: true,
      room
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      message: "Invalid room ID"
    });
  }
});

module.exports = router;