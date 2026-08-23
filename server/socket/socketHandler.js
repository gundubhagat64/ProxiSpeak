const User = require("../models/User");
const {
  pixelToGeo,
  findNearbyUsers
} = require("../proximity");

const WORLD_WIDTH = 1150;
const WORLD_HEIGHT = 650;

const setupSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

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

    // Find users within 100 pixels
    const nearbyUsers = await findNearbyUsers(
      user.userId,
      x,
      y,
      100
    );

    // Send proximity information to the moving user
    socket.emit("proximity:update", {
      userId: user.userId,

      nearbyUsers: nearbyUsers.map((nearbyUser) => ({
        userId: nearbyUser.userId,
        name: nearbyUser.name,
        position: nearbyUser.position
      }))
    });

    console.log(
      `${user.name} has ${nearbyUsers.length} nearby users`
    );
  } catch (error) {
    console.error("Movement error:", error.message);
  }
});

    socket.on("disconnect", async () => {
      try {
        const user = await User.findOneAndUpdate(
          {
            socketId: socket.id
          },
          {
            isOnline: false
          },
          {
            new: true
          }
        );

        if (user) {
          io.emit("user:left", {
            userId: user.userId
          });

          console.log(`${user.name} disconnected`);
        }

        console.log(`Socket disconnected: ${socket.id}`);
      } catch (error) {
        console.error("Disconnect error:", error.message);
      }
    });
  });
};

module.exports = setupSocket;