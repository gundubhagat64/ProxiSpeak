const User = require("../models/User");

const setupSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("user:join", async (data) => {
      try {
        const {
          userId,
          name,
          x = 400,
          y = 300
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
          typeof y !== "number"
        ) {
          return;
        }

        const user = await User.findOneAndUpdate(
          {
            userId,
            socketId: socket.id
          },
          {
            position: {
              x,
              y
            }
          },
          {
            new: true
          }
        );

        if (!user) {
          return;
        }

        socket.broadcast.emit("avatar:moved", {
          userId: user.userId,
          position: {
            x: user.position.x,
            y: user.position.y
          }
        });
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