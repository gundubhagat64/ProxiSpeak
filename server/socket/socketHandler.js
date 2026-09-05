const User = require("../models/User");
const Room = require("../models/Room");

const {
  pixelToGeo,
  findNearbyUsers
} = require("../proximity");

const {
  calculateSpatialAudio
} = require("../services/obstacleService");

const WORLD_WIDTH = 1150;
const WORLD_HEIGHT = 650;

const DEFAULT_PROXIMITY_RADIUS = 100;

/**
 * Keep room layouts in memory.
 *
 * MongoDB = persistent storage
 * Memory = fast real-time spatial calculations
 */
const roomCache = new Map();

/**
 * Load room layout.
 */
async function getRoomLayout(roomId) {
  if (!roomId) {
    return null;
  }

  if (roomCache.has(roomId)) {
    return roomCache.get(roomId);
  }

  try {
    const room =
      await Room.findById(roomId).lean();

    if (!room) {
      return null;
    }

    roomCache.set(roomId, room);

    return room;
  } catch (error) {
    console.error(
      "Room layout load error:",
      error.message
    );

    return null;
  }
}

/**
 * Refresh room cache after layout update.
 */
async function refreshRoomCache(roomId) {
  if (!roomId) {
    return null;
  }

  try {
    const room =
      await Room.findById(roomId).lean();

    if (!room) {
      roomCache.delete(roomId);

      return null;
    }

    roomCache.set(roomId, room);

    return room;
  } catch (error) {
    console.error(
      "Room cache refresh error:",
      error.message
    );

    return null;
  }
}

/**
 * Get socket users' room layout.
 */
async function getAudioLayout(roomId) {
  const room = await getRoomLayout(
    roomId
  );

  if (!room) {
    return [];
  }

  return room.obstacles || [];
}

const setupSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(
      `Socket connected: ${socket.id}`
    );

    /**
     * USER JOIN
     */
    socket.on(
      "user:join",
      async (data) => {
        try {
          const {
            userId,
            name,
            roomId,
            x = 200,
            y = 150
          } = data;

          if (!userId || !name) {
            socket.emit(
              "server:error",
              {
                message:
                  "userId and name are required"
              }
            );

            return;
          }

          /**
           * If roomId exists,
           * load room layout.
           */
          let room = null;

          if (roomId) {
            room =
              await getRoomLayout(
                roomId
              );

            if (!room) {
              socket.emit(
                "server:error",
                {
                  message:
                    "Room not found"
                }
              );

              return;
            }

            /**
             * Join Socket.IO room.
             */
            socket.join(roomId);
          }

          const user =
            await User.findOneAndUpdate(
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
                  coordinates:
                    pixelToGeo(x, y)
                },

                isOnline: true
              },
              {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true
              }
            );

          socket.broadcast.emit(
            "user:joined",
            {
              userId:
                user.userId,

              name:
                user.name,

              position:
                user.position
            }
          );

          const onlineUsers =
            await User.find(
              {
                isOnline: true
              },
              {
                _id: 0,
                userId: 1,
                name: 1,
                position: 1
              }
            );

          socket.emit(
            "users:list",
            onlineUsers
          );

          /**
           * Send office layout
           * to new user.
           */
          if (room) {
            socket.emit(
              "office:layout",
              {
                roomId:
                  room._id,

                name:
                  room.name,

                width:
                  room.width,

                height:
                  room.height,

                spawnPoint:
                  room.spawnPoint,

                furniture:
                  room.furniture,

                obstacles:
                  room.obstacles,

                version:
                  room.version
              }
            );
          }

          console.log(
            `${name} joined the virtual office`
          );
        } catch (error) {
          console.error(
            "Join error:",
            error
          );

          socket.emit(
            "server:error",
            {
              message:
                "Unable to join the virtual office"
            }
          );
        }
      }
    );

    /**
     * AVATAR MOVEMENT
     */
    socket.on(
      "avatar:move",
      async (data) => {
        try {
          const {
            userId,
            roomId,
            x,
            y
          } = data;

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

          /**
           * Update MongoDB position.
           */
          const user =
            await User.findOneAndUpdate(
              {
                userId,
                socketId:
                  socket.id
              },
              {
                position: {
                  x,
                  y
                },

                location: {
                  type: "Point",
                  coordinates:
                    pixelToGeo(x, y)
                }
              },
              {
                new: true
              }
            );

          if (!user) {
            return;
          }

          /**
           * Broadcast movement.
           *
           * If roomId exists, only
           * broadcast inside room.
           */
          if (roomId) {
            socket.to(roomId).emit(
              "avatar:moved",
              {
                userId:
                  user.userId,

                position: {
                  x:
                    user.position.x,

                  y:
                    user.position.y
                }
              }
            );
          } else {
            socket.broadcast.emit(
              "avatar:moved",
              {
                userId:
                  user.userId,

                position: {
                  x:
                    user.position.x,

                  y:
                    user.position.y
                }
              }
            );
          }

          /**
           * MongoDB geospatial query.
           */
          const nearbyUsers =
            await findNearbyUsers(
              user.userId,
              x,
              y,
              DEFAULT_PROXIMITY_RADIUS
            );

          /**
           * Load cached office obstacles.
           */
          const obstacles =
            await getAudioLayout(
              roomId
            );

          /**
           * Calculate audio state
           * for every nearby user.
           */
          const nearbyAudio =
            nearbyUsers.map(
              (nearbyUser) => {
                const source = {
                  x,
                  y
                };

                const target = {
                  x:
                    nearbyUser.position.x,

                  y:
                    nearbyUser.position.y
                };

                const spatialAudio =
                  calculateSpatialAudio(
                    source,
                    target,
                    obstacles,
                    DEFAULT_PROXIMITY_RADIUS
                  );

                return {
                  userId:
                    nearbyUser.userId,

                  name:
                    nearbyUser.name,

                  position:
                    nearbyUser.position,

                  distance:
                    spatialAudio.distance,

                  distanceGain:
                    spatialAudio.distanceGain,

                  obstacleGain:
                    spatialAudio.obstacleGain,

                  finalGain:
                    spatialAudio.finalGain,

                  blocked:
                    spatialAudio.blocked,

                  blockingObstacles:
                    spatialAudio.blockingObstacles
                };
              }
            );

          /**
           * Send proximity + audio
           * information to moving user.
           */
          socket.emit(
            "proximity:update",
            {
              userId:
                user.userId,

              nearbyUsers:
                nearbyAudio
            }
          );

          /**
           * Optional:
           * tell nearby users about
           * this user's audio state.
           */
          for (
            const nearbyUser
            of nearbyAudio
          ) {
            const targetSocket =
              io.sockets.sockets;

            for (
              const [
                socketId,
                connectedSocket
              ] of targetSocket
            ) {
              if (
                connectedSocket.id ===
                socket.id
              ) {
                continue;
              }

              connectedSocket.emit(
                "audio:spatial-update",
                {
                  sourceUserId:
                    user.userId,

                  position:
                    user.position,

                  distance:
                    nearbyUser.distance,

                  distanceGain:
                    nearbyUser.distanceGain,

                  obstacleGain:
                    nearbyUser.obstacleGain,

                  finalGain:
                    nearbyUser.finalGain,

                  blocked:
                    nearbyUser.blocked,

                  blockingObstacles:
                    nearbyUser.blockingObstacles
                }
              );
            }
          }

          console.log(
            `${user.name} has ${nearbyAudio.length} nearby users`
          );
        } catch (error) {
          console.error(
            "Movement error:",
            error.message
          );
        }
      }
    );

    /**
     * REQUEST OFFICE LAYOUT
     */
    socket.on(
      "office:get-layout",
      async (data) => {
        try {
          const {
            roomId
          } = data;

          const room =
            await getRoomLayout(
              roomId
            );

          if (!room) {
            socket.emit(
              "server:error",
              {
                message:
                  "Office layout not found"
              }
            );

            return;
          }

          socket.emit(
            "office:layout",
            {
              roomId:
                room._id,

              name:
                room.name,

              width:
                room.width,

              height:
                room.height,

              spawnPoint:
                room.spawnPoint,

              furniture:
                room.furniture,

              obstacles:
                room.obstacles,

              version:
                room.version
            }
          );
        } catch (error) {
          console.error(
            "Layout error:",
            error.message
          );
        }
      }
    );

    /**
     * Refresh layout manually.
     *
     * Useful after admin/editor
     * changes office furniture.
     */
    socket.on(
      "office:refresh",
      async (data) => {
        try {
          const {
            roomId
          } = data;

          const room =
            await refreshRoomCache(
              roomId
            );

          if (!room) {
            return;
          }

          io.to(roomId).emit(
            "office:layout",
            {
              roomId:
                room._id,

              name:
                room.name,

              width:
                room.width,

              height:
                room.height,

              spawnPoint:
                room.spawnPoint,

              furniture:
                room.furniture,

              obstacles:
                room.obstacles,

              version:
                room.version
            }
          );
        } catch (error) {
          console.error(
            "Office refresh error:",
            error.message
          );
        }
      }
    );

    /**
     * DISCONNECT
     */
    socket.on(
      "disconnect",
      async () => {
        try {
          const user =
            await User.findOneAndUpdate(
              {
                socketId:
                  socket.id
              },
              {
                isOnline:
                  false
              },
              {
                new: true
              }
            );

          if (user) {
            io.emit(
              "user:left",
              {
                userId:
                  user.userId
              }
            );

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
      }
    );
  });
};

module.exports = setupSocket;