const User = require("../models/User");
const {
  findNearbyUsers,
  pixelToGeo,
} = require("../proximity");

const WORLD_WIDTH = 1150;
const WORLD_HEIGHT = 650;
const HEARING_DISTANCE = 100;

// Track current proximity relationships.
// userId -> Set of nearby userIds
const proximityState = new Map();

function isValidPosition(x, y) {
  return (
    typeof x === "number" &&
    typeof y === "number" &&
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    x >= 0 &&
    x <= WORLD_WIDTH &&
    y >= 0 &&
    y <= WORLD_HEIGHT
  );
}

function getNearbyIds(users) {
  return new Set(users.map((user) => user.userId));
}

function setProximity(userId, nearbyIds) {
  proximityState.set(userId, nearbyIds);
}

function getPreviousProximity(userId) {
  return proximityState.get(userId) || new Set();
}

function deleteProximityUser(userId) {
  proximityState.delete(userId);

  for (const [otherUserId, nearbyIds] of proximityState.entries()) {
    nearbyIds.delete(userId);
    proximityState.set(otherUserId, nearbyIds);
  }
}

async function sendPeerLeft(io, userId, remoteUserId) {
  try {
    const remoteUser = await User.findOne({
      userId: remoteUserId,
      isOnline: true,
    }).select("socketId");

    if (!remoteUser?.socketId) return;

    io.to(remoteUser.socketId).emit("webrtc:peer-left", {
      userId,
    });
  } catch (error) {
    console.error("sendPeerLeft error:", error);
  }
}

function setupSocket(io) {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ============================================================
    // USER JOIN
    // ============================================================

    socket.on("user:join", async (data, callback) => {
      try {
        const { userId, name, x, y } = data || {};

        if (!userId || !name) {
          socket.emit("server:error", {
            message: "userId and name are required",
          });

          return;
        }

        const positionX =
          typeof x === "number" ? x : 200;

        const positionY =
          typeof y === "number" ? y : 150;

        if (!isValidPosition(positionX, positionY)) {
          socket.emit("server:error", {
            message: "Invalid starting position",
          });

          return;
        }

        const [longitude, latitude] =
          pixelToGeo(positionX, positionY);

        const user = await User.findOneAndUpdate(
          { userId },
          {
            userId,
            socketId: socket.id,
            name,
            position: {
              x: positionX,
              y: positionY,
            },
            location: {
              type: "Point",
              coordinates: [
                longitude,
                latitude,
              ],
            },
            isOnline: true,
          },
          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
          }
        );

        socket.userId = userId;

        // Start empty proximity state.
        proximityState.set(userId, new Set());

        console.log(
          `User joined: ${name} (${userId})`
        );

        // Tell everyone else.
        socket.broadcast.emit(
          "user:joined",
          {
            userId: user.userId,
            name: user.name,
            position: user.position,
            location: user.location,
          }
        );

        // Send current online users.
        const onlineUsers =
          await User.find({
            isOnline: true,
          }).select(
            "userId name position location socketId"
          );

        socket.emit(
          "users:list",
          onlineUsers.map((onlineUser) => ({
            userId: onlineUser.userId,
            name: onlineUser.name,
            position: onlineUser.position,
            location: onlineUser.location,
          }))
        );

        if (typeof callback === "function") {
          callback({
            success: true,
            userId: user.userId,
          });
        }
      } catch (error) {
        console.error(
          "user:join error:",
          error
        );

        socket.emit("server:error", {
          message: "Failed to join office",
        });

        if (typeof callback === "function") {
          callback({
            success: false,
            message: "Failed to join office",
          });
        }
      }
    });

    // ============================================================
    // AVATAR MOVE
    // ============================================================

    socket.on("avatar:move", async (data) => {
      try {
        const { userId, x, y } = data || {};

        if (!socket.userId) {
          socket.emit("server:error", {
            message: "You must join first",
          });

          return;
        }

        if (userId !== socket.userId) {
          socket.emit("server:error", {
            message: "Unauthorized movement",
          });

          return;
        }

        if (!isValidPosition(x, y)) {
          socket.emit("server:error", {
            message: "Invalid position",
          });

          return;
        }

        const [longitude, latitude] =
          pixelToGeo(x, y);

        const updatedUser =
          await User.findOneAndUpdate(
            {
              userId,
              isOnline: true,
              socketId: socket.id,
            },
            {
              position: {
                x,
                y,
              },
              location: {
                type: "Point",
                coordinates: [
                  longitude,
                  latitude,
                ],
              },
            },
            {
              new: true,
            }
          );

        if (!updatedUser) {
          return;
        }

        // Tell everyone about movement.
        socket.broadcast.emit(
          "avatar:moved",
          {
            userId,
            x,
            y,
          }
        );

        // ========================================================
        // FIND USERS WITHIN HEARING DISTANCE
        // ========================================================

        const nearbyUsers =
          await findNearbyUsers(
            userId,
            x,
            y,
            HEARING_DISTANCE
          );

        const currentNearbyIds =
          getNearbyIds(nearbyUsers);

        const previousNearbyIds =
          getPreviousProximity(userId);

        // ========================================================
        // USERS WHO ENTERED HEARING RANGE
        // ========================================================

        for (const nearbyUser of nearbyUsers) {
          const entered =
            !previousNearbyIds.has(
              nearbyUser.userId
            );

          if (!entered) continue;

          // Tell moving user about remote peer.
          socket.emit(
            "proximity:peer-nearby",
            {
              userId:
                nearbyUser.userId,

              socketId:
                nearbyUser.socketId,

              name:
                nearbyUser.name,

              position:
                nearbyUser.position,
            }
          );

          // Tell remote user about moving user.
          if (nearbyUser.socketId) {
            io.to(
              nearbyUser.socketId
            ).emit(
              "proximity:peer-nearby",
              {
                userId:
                  updatedUser.userId,

                socketId:
                  socket.id,

                name:
                  updatedUser.name,

                position:
                  updatedUser.position,
              }
            );
          }
        }

        // ========================================================
        // USERS WHO LEFT HEARING RANGE
        // ========================================================

        for (const previousUserId of previousNearbyIds) {
          if (
            currentNearbyIds.has(
              previousUserId
            )
          ) {
            continue;
          }

          // Tell local client.
          socket.emit(
            "webrtc:peer-left",
            {
              userId:
                previousUserId,
            }
          );

          // Tell remote client.
          await sendPeerLeft(
            io,
            userId,
            previousUserId
          );
        }

        // Save new proximity state.
        setProximity(
          userId,
          currentNearbyIds
        );

        // ========================================================
        // PROXIMITY UPDATE
        // ========================================================

        const nearbyPayload =
          nearbyUsers.map((user) => ({
            userId:
              user.userId,

            name:
              user.name,

            position:
              user.position,

            location:
              user.location,
          }));

        socket.emit(
          "proximity:update",
          nearbyPayload
        );
      } catch (error) {
        console.error(
          "avatar:move error:",
          error
        );
      }
    });

    // ============================================================
    // WEBRTC OFFER
    // ============================================================

    socket.on(
      "webrtc:offer",
      ({
        to,
        offer,
      } = {}) => {
        try {
          if (!to || !offer) return;

          io.to(to).emit(
            "webrtc:offer",
            {
              from: socket.id,
              fromUserId:
                socket.userId,
              offer,
            }
          );

          console.log(
            `WebRTC offer: ${socket.id} -> ${to}`
          );
        } catch (error) {
          console.error(
            "webrtc:offer error:",
            error
          );
        }
      }
    );

    // ============================================================
    // WEBRTC ANSWER
    // ============================================================

    socket.on(
      "webrtc:answer",
      ({
        to,
        answer,
      } = {}) => {
        try {
          if (!to || !answer) return;

          io.to(to).emit(
            "webrtc:answer",
            {
              from: socket.id,
              fromUserId:
                socket.userId,
              answer,
            }
          );

          console.log(
            `WebRTC answer: ${socket.id} -> ${to}`
          );
        } catch (error) {
          console.error(
            "webrtc:answer error:",
            error
          );
        }
      }
    );

    // ============================================================
    // WEBRTC ICE CANDIDATE
    // ============================================================

    socket.on(
      "webrtc:ice-candidate",
      ({
        to,
        candidate,
      } = {}) => {
        try {
          if (!to || !candidate) return;

          io.to(to).emit(
            "webrtc:ice-candidate",
            {
              from: socket.id,
              fromUserId:
                socket.userId,
              candidate,
            }
          );
        } catch (error) {
          console.error(
            "webrtc:ice-candidate error:",
            error
          );
        }
      }
    );

    // ============================================================
    // MANUAL WEBRTC PEER LEFT
    // ============================================================

    socket.on(
      "webrtc:peer-left",
      ({
        to,
      } = {}) => {
        if (!to) return;

        io.to(to).emit(
          "webrtc:peer-left",
          {
            userId:
              socket.userId,
          }
        );
      }
    );

    // ============================================================
    // CHAT
    // ============================================================

    socket.on(
      "chat:send",
      async (messageData = {}) => {
        try {
          if (!socket.userId) return;

          const {
            message,
            text,
          } = messageData;

          const content =
            typeof message === "string"
              ? message
              : typeof text === "string"
              ? text
              : "";

          const cleanMessage =
            content.trim();

          if (!cleanMessage) return;

          const user =
            await User.findOne({
              userId:
                socket.userId,
            }).select(
              "userId name"
            );

          io.emit(
            "chat:receive",
            {
              userId:
                socket.userId,

              name:
                user?.name || "User",

              message:
                cleanMessage,

              timestamp:
                new Date().toISOString(),
            }
          );
        } catch (error) {
          console.error(
            "chat:send error:",
            error
          );
        }
      }
    );

    // ============================================================
    // DISCONNECT
    // ============================================================

    socket.on(
      "disconnect",
      async () => {
        try {
          console.log(
            `Socket disconnected: ${socket.id}`
          );

          if (!socket.userId) {
            return;
          }

          const user =
            await User.findOneAndUpdate(
              {
                userId:
                  socket.userId,

                socketId:
                  socket.id,
              },
              {
                isOnline: false,

                // IMPORTANT:
                // Keep this as null only if your
                // User schema allows null.
                socketId: null,
              },
              {
                new: true,
              }
            );

          if (user) {
            // Notify everyone.
            io.emit(
              "user:left",
              {
                userId:
                  socket.userId,
              }
            );

            io.emit(
              "webrtc:peer-left",
              {
                userId:
                  socket.userId,
              }
            );

            console.log(
              `User offline: ${socket.userId}`
            );
          }

          deleteProximityUser(
            socket.userId
          );
        } catch (error) {
          console.error(
            "disconnect error:",
            error
          );
        }
      }
    );
  });
}

module.exports = setupSocket;