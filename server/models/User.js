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
// Add the name field to store the user's name
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
// Add the position field to store the user's position on the map
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
// Add the location field to store the user's geographical location
    location: {
      type: {
        type: String,
        default: "Point"
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    },
 // Add the isOnline field to track the user's online status
    isOnline: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

userSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User", userSchema);