const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    socketId: {
      type: String,
      default: null,
      sparse: true,
    },

    userId: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    position: {
      x: {
        type: Number,
        default: 400,
      },

      y: {
        type: Number,
        default: 300,
      },
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },

      coordinates: {
        type: [Number],
        default: [75, 26],
      },
    },

    isOnline: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({
  location: "2dsphere",
});

module.exports =
  mongoose.model(
    "User",
    userSchema
  );