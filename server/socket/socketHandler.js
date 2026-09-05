const User = require("../models/User");
const {
  pixelToGeo,
  findNearbyUsers
} = require("../proximity");

const WORLD_WIDTH = 1150;
const WORLD_HEIGHT = 650;
const HEARING_DISTANCE = 100;

const setupSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Store the logged-in user ID for this socket
    let connectedUserId = null;

    // ==========================================
    // USER JOIN
    // ==========================================

    socket.on("user:join", async (data) => {
      try {
        const {
          userId,
          name,
          x = 200,
          y = 150
        } = data;

        if (!userId || !name) {
          socket.emit("server:error", {
            message: "userId and name are required"
          });

          return;
        }

        connectedUserId = userId;

        const user = await User.findOneAndUpdate(
          { userId },
          {
            socketId: socket.id,
            userId,
            name,

            position: {
              x,
              y
            },

            location: {
              type: "Point",
              coordinates: pixelToGeo(x, y)
            },

            isOnline: true
          },
          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
          }
        );

        socket.broadcast.emit("user:joined", {
          userId: user.userId,
          name: user.name,
          position: user.position
        });

        const onlineUsers = await User.find(
          { isOnline: true },
          {
            _id: 0,
            userId: 1,
            name: 1,
            position: 1
          }
        );

        socket.emit("users:list", onlineUsers);

        console.log(`${name} joined the office`);
      } catch (error) {
        console.error("Join error:", error);

        socket.emit("server:error", {
          message: "Unable to join the virtual office"
        });
      }
    });

    // ==========================================
    // AVATAR MOVEMENT
    // ==========================================

    socket.on("avatar:move", async (data) => {
      try {
        const { userId, x, y } = data;

        if (
          !userId ||
          typeof x !== "number" ||
          typeof y !== "number" ||
          x < 0 ||
          x > WORLD_WIDTH ||
          y < 0 ||
          y > WORLD_HEIGHT
        ) {
          return;
        }

        // Security:
        // Only allow the user connected to this socket
        // to update their own position.
        if (connectedUserId !== userId) {
          return;
        }

        // Update user's position in MongoDB
        const user = await User.findOneAndUpdate(
          {
            userId,
            socketId: socket.id
          },
          {
            position: {
              x,
              y
            },

            location: {
              type: "Point",
              coordinates: pixelToGeo(x, y)
            }
          },
          {
            new: true
          }
        );

        if (!user) {
          return;
        }

        // Broadcast movement to other users
        socket.broadcast.emit("avatar:moved", {
          userId: user.userId,

          position: {
            x: user.position.x,
            y: user.position.y
          }
        });

        // ==========================================
        // PROXIMITY
        // ==========================================

        const nearbyUsers = await findNearbyUsers(
          user.userId,
          x,
          y,
          HEARING_DISTANCE
        );

        const nearbyUserData = nearbyUsers.map((nearbyUser) => ({
          userId: nearbyUser.userId,
          name: nearbyUser.name,
          position: nearbyUser.position
        }));

        // Send proximity information to moving user
        socket.emit("proximity:update", {
          userId: user.userId,
          nearbyUsers: nearbyUserData
        });

        // ==========================================
        // WEBRTC PROXIMITY SIGNAL
        // ==========================================

        // Tell nearby users that this user is within
        // the 100px audio range.
        for (const nearbyUser of nearbyUsers) {
          if (!nearbyUser.socketId) {
            continue;
          }

          io.to(nearbyUser.socketId).emit("proximity:peer-nearby", {
            userId: user.userId,
            name: user.name,
            position: user.position
          });
        }

        console.log(
          `${user.name} has ${nearbyUsers.length} nearby users`
        );
      } catch (error) {
        console.error(
          "Movement error:",
          error.message
        );
      }
    });

    // ==========================================
    // WEBRTC OFFER
    // ==========================================

    socket.on("webrtc:offer", async (data) => {
      try {
        const {
          targetUserId,
          offer
        } = data || {};

        if (!targetUserId || !offer) {
          return;
        }

        if (!connectedUserId) {
          return;
        }

        // Find target user
        const targetUser = await User.findOne({
          userId: targetUserId,
          isOnline: true
        });

        if (!targetUser || !targetUser.socketId) {
          return;
        }

        // Forward offer
        io.to(targetUser.socketId).emit(
          "webrtc:offer",
          {
            fromUserId: connectedUserId,
            offer
          }
        );

        console.log(
          `WebRTC offer: ${connectedUserId} -> ${targetUserId}`
        );
      } catch (error) {
        console.error(
          "WebRTC offer error:",
          error.message
        );
      }
    });

    // ==========================================
    // WEBRTC ANSWER
    // ==========================================

    socket.on("webrtc:answer", async (data) => {
      try {
        const {
          targetUserId,
          answer
        } = data || {};

        if (!targetUserId || !answer) {
          return;
        }

        if (!connectedUserId) {
          return;
        }

        const targetUser = await User.findOne({
          userId: targetUserId,
          isOnline: true
        });

        if (!targetUser || !targetUser.socketId) {
          return;
        }

        // Forward answer
        io.to(targetUser.socketId).emit(
          "webrtc:answer",
          {
            fromUserId: connectedUserId,
            answer
          }
        );

        console.log(
          `WebRTC answer: ${connectedUserId} -> ${targetUserId}`
        );
      } catch (error) {
        console.error(
          "WebRTC answer error:",
          error.message
        );
      }
    });

    // ==========================================
    // WEBRTC ICE CANDIDATE
    // ==========================================

    socket.on(
      "webrtc:ice-candidate",
      async (data) => {
        try {
          const {
            targetUserId,
            candidate
          } = data || {};

          if (!targetUserId || !candidate) {
            return;
          }

          if (!connectedUserId) {
            return;
          }

          const targetUser = await User.findOne({
            userId: targetUserId,
            isOnline: true
          });

          if (!targetUser || !targetUser.socketId) {
            return;
          }

          // Forward ICE candidate
          io.to(targetUser.socketId).emit(
            "webrtc:ice-candidate",
            {
              fromUserId: connectedUserId,
              candidate
            }
          );

          console.log(
            `ICE candidate: ${connectedUserId} -> ${targetUserId}`
          );
        } catch (error) {
          console.error(
            "ICE candidate error:",
            error.message
          );
        }
      }
    );

    // ==========================================
    // WEBRTC PEER LEAVE
    // ==========================================

    socket.on(
      "webrtc:peer-left",
      async (data) => {
        try {
          const {
            targetUserId
          } = data || {};

          if (!targetUserId || !connectedUserId) {
            return;
          }

          const targetUser = await User.findOne({
            userId: targetUserId,
            isOnline: true
          });

          if (!targetUser || !targetUser.socketId) {
            return;
          }

          io.to(targetUser.socketId).emit(
            "webrtc:peer-left",
            {
              userId: connectedUserId
            }
          );
        } catch (error) {
          console.error(
            "Peer leave error:",
            error.message
          );
        }
      }
    );

    // ==========================================
    // DISCONNECT
    // ==========================================

    socket.on("disconnect", async () => {
      try {
        const user = await User.findOneAndUpdate(
          {
            socketId: socket.id
          },
          {
            isOnline: false,
            socketId: null
          },
          {
            new: true
          }
        );

        if (user) {
          // Tell all clients that this user left
          io.emit("user:left", {
            userId: user.userId
          });

          // Tell all clients to close WebRTC connection
          io.emit("webrtc:peer-left", {
            userId: user.userId
          });

          console.log(
            `${user.name} disconnected`
          );
        }

        console.log(
          `Socket disconnected: ${socket.id}`
        );
      } catch (error) {
        console.error(
          "Disconnect error:",
          error.message
        );
      }
    });
  });
};

module.exports = setupSocket;