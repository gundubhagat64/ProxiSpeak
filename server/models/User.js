const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    socketId: {
      type: String,
      required: true,
      unique: true
    },

    userId: {
      type: String,
      required: true,
      unique: true
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },

    position: {
      x: {
        type: Number,
        default: 400
      },
      y: {
        type: Number,
        default: 300
      }
    },

    location: {
      type: [Number],
        default: [400, 300]
      },

      isOnline: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

userSchema.index({ location: "2d" });

module.exports = mongoose.model("User", userSchema);