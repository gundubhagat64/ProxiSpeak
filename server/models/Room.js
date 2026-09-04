const mongoose = require("mongoose");

const obstacleSchema = new mongoose.Schema(
  {
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
      min: 0
    },

    height: {
      type: Number,
      required: true,
      min: 0
    },

    blocksSound: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
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

    obstacles: {
      type: [obstacleSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Room", roomSchema);