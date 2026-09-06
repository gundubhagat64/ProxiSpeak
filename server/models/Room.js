const mongoose = require("mongoose");

const furnitureSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "wall",
        "table",
        "desk",
        "chair",
        "sofa",
        "cabinet",
        "door",
        "plant",
        "meeting-room",
        "custom"
      ],
      default: "custom"
    },

    name: {
      type: String,
      default: "Furniture"
    },

    x: {
      type: Number,
      required: true
    },

    y: {
      type: Number,
      required: true
    },

    width: {
      type: Number,
      required: true,
      min: 1
    },

    height: {
      type: Number,
      required: true,
      min: 1
    },

    rotation: {
      type: Number,
      default: 0
    },

    blocksSound: {
      type: Boolean,
      default: false
    },

    soundAttenuation: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    }
  },
  { _id: true }
);

const obstacleSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "wall",
        "door",
        "window",
        "partition",
        "custom"
      ],
      default: "wall"
    },

    x: {
      type: Number,
      required: true
    },

    y: {
      type: Number,
      required: true
    },

    width: {
      type: Number,
      required: true,
      min: 1
    },

    height: {
      type: Number,
      required: true,
      min: 1
    },

    blocksSound: {
      type: Boolean,
      default: true
    },

    soundAttenuation: {
      type: Number,
      min: 0,
      max: 1,
      default: 1
    }
  },
  { _id: true }
);

const spawnPointSchema = new mongoose.Schema(
  {
    x: {
      type: Number,
      default: 200
    },

    y: {
      type: Number,
      default: 150
    }
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    width: {
      type: Number,
      required: true,
      min: 100
    },

    height: {
      type: Number,
      required: true,
      min: 100
    },

    spawnPoint: {
      type: spawnPointSchema,
      default: () => ({
        x: 200,
        y: 150
      })
    },

    furniture: {
      type: [furnitureSchema],
      default: []
    },

    obstacles: {
      type: [obstacleSchema],
      default: []
    },

    version: {
      type: Number,
      default: 1
    },

    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Room", roomSchema);