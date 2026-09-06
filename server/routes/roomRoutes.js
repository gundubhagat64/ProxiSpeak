const express = require("express");
const Room = require("../models/Room");

const router = express.Router();

/**
 * POST /api/rooms
 * Create office layout
 */
router.post("/", async (req, res) => {
  try {
    const room = new Room(req.body);

    const savedRoom = await room.save();

    res.status(201).json({
      success: true,
      room: savedRoom
    });
  } catch (error) {
    console.error("Create room error:", error);

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/rooms
 * Get all rooms
 */
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find({
      active: true
    }).sort({
      createdAt: -1
    });

    res.json({
      success: true,
      count: rooms.length,
      rooms
    });
  } catch (error) {
    console.error("Get rooms error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch rooms"
    });
  }
});

/**
 * GET /api/rooms/:id
 * Get one room
 */
router.get("/:id", async (req, res) => {
  try {
    const room = await Room.findById(
      req.params.id
    );

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
    console.error("Get room error:", error);

    res.status(400).json({
      success: false,
      message: "Invalid room ID"
    });
  }
});

/**
 * PUT /api/rooms/:id
 * Update complete office layout
 */
router.put("/:id", async (req, res) => {
  try {
    const room =
      await Room.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          $inc: {
            version: 1
          }
        },
        {
          new: true,
          runValidators: true
        }
      );

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
    console.error("Update room error:", error);

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/rooms/:id/furniture
 * Add furniture
 */
router.post("/:id/furniture", async (req, res) => {
  try {
    const room =
      await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    room.furniture.push(req.body);

    room.version += 1;

    await room.save();

    const furniture =
      room.furniture[
        room.furniture.length - 1
      ];

    res.status(201).json({
      success: true,
      furniture,
      room
    });
  } catch (error) {
    console.error(
      "Add furniture error:",
      error
    );

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * DELETE /api/rooms/:id/furniture/:furnitureId
 */
router.delete(
  "/:id/furniture/:furnitureId",
  async (req, res) => {
    try {
      const room =
        await Room.findById(
          req.params.id
        );

      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found"
        });
      }

      const furniture =
        room.furniture.id(
          req.params.furnitureId
        );

      if (!furniture) {
        return res.status(404).json({
          success: false,
          message: "Furniture not found"
        });
      }

      furniture.deleteOne();

      room.version += 1;

      await room.save();

      res.json({
        success: true,
        room
      });
    } catch (error) {
      console.error(
        "Delete furniture error:",
        error
      );

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * POST /api/rooms/:id/obstacles
 * Add sound obstacle
 */
router.post(
  "/:id/obstacles",
  async (req, res) => {
    try {
      const room =
        await Room.findById(
          req.params.id
        );

      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found"
        });
      }

      room.obstacles.push(req.body);

      room.version += 1;

      await room.save();

      const obstacle =
        room.obstacles[
          room.obstacles.length - 1
        ];

      res.status(201).json({
        success: true,
        obstacle,
        room
      });
    } catch (error) {
      console.error(
        "Add obstacle error:",
        error
      );

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * DELETE /api/rooms/:id/obstacles/:obstacleId
 */
router.delete(
  "/:id/obstacles/:obstacleId",
  async (req, res) => {
    try {
      const room =
        await Room.findById(
          req.params.id
        );

      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found"
        });
      }

      const obstacle =
        room.obstacles.id(
          req.params.obstacleId
        );

      if (!obstacle) {
        return res.status(404).json({
          success: false,
          message: "Obstacle not found"
        });
      }

      obstacle.deleteOne();

      room.version += 1;

      await room.save();

      res.json({
        success: true,
        room
      });
    } catch (error) {
      console.error(
        "Delete obstacle error:",
        error
      );

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router;