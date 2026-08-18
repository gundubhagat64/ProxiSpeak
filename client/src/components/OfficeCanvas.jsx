import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import Furniture from "./Furniture";
import MiniMap from "./MiniMap";
import OnlineUsers from "./OnlineUsers";
import ChatBox from "./ChatBox";
import socket from "../socket";

function OfficeCanvas() {
  const [position, setPosition] = useState({
    x: 200,
    y: 150,
  });

  const [users, setUsers] = useState([]);

  const username =
    localStorage.getItem("username") || "Guest";

  // Create unique user ID
  const [userId] = useState(() => {
    let id = localStorage.getItem("userId");

    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("userId", id);
    }

    return id;
  });

  // Obstacles
  const obstacles = [
    {
      x: 350,
      y: 180,
      width: 140,
      height: 80,
    },
    {
      x: 650,
      y: 320,
      width: 140,
      height: 80,
    },
    {
      x: 100,
      y: 430,
      width: 220,
      height: 140,
    },
  ];

  // Collision Detection
  const checkCollision = (x, y) => {
    const avatarSize = 40;

    return obstacles.some((obj) => {
      return (
        x < obj.x + obj.width &&
        x + avatarSize > obj.x &&
        y < obj.y + obj.height &&
        y + avatarSize > obj.y
      );
    });
  };

  // ================= SOCKET.IO =================

  useEffect(() => {
    const handleConnect = () => {
      console.log(
        "Socket connected:",
        socket.id
      );

      socket.emit("user:join", {
        userId,
        name: username,
        x: position.x,
        y: position.y,
      });

      console.log(
        "Join request sent:",
        username
      );
    };

    const handleUsersList = (onlineUsers) => {
      console.log(
        "Online users:",
        onlineUsers
      );

      setUsers(onlineUsers);
    };

    const handleUserJoined = (user) => {
      console.log("User joined:", user);

      setUsers((prev) => {
        const exists = prev.some(
          (item) =>
            item.userId === user.userId
        );

        if (exists) {
          return prev;
        }

        return [...prev, user];
      });
    };

    const handleAvatarMoved = (data) => {
      setUsers((prev) =>
        prev.map((user) =>
          user.userId === data.userId
            ? {
                ...user,
                position: data.position,
              }
            : user
        )
      );
    };

    const handleUserLeft = (data) => {
      console.log(
        "User left:",
        data.userId
      );

      setUsers((prev) =>
        prev.filter(
          (user) =>
            user.userId !== data.userId
        )
      );
    };

    const handleServerError = (data) => {
      console.error(
        "Server error:",
        data.message
      );
    };

    socket.on(
      "connect",
      handleConnect
    );

    socket.on(
      "users:list",
      handleUsersList
    );

    socket.on(
      "user:joined",
      handleUserJoined
    );

    socket.on(
      "avatar:moved",
      handleAvatarMoved
    );

    socket.on(
      "user:left",
      handleUserLeft
    );

    socket.on(
      "server:error",
      handleServerError
    );

    if (!socket.connected) {
      socket.connect();
    } else {
      handleConnect();
    }

    return () => {
      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "users:list",
        handleUsersList
      );

      socket.off(
        "user:joined",
        handleUserJoined
      );

      socket.off(
        "avatar:moved",
        handleAvatarMoved
      );

      socket.off(
        "user:left",
        handleUserLeft
      );

      socket.off(
        "server:error",
        handleServerError
      );

      socket.disconnect();
    };
  }, [userId, username]);

  // ================= MOVEMENT =================

  useEffect(() => {
    const handleKey = (e) => {
      const allowedKeys = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ];

      if (!allowedKeys.includes(e.key)) {
        return;
      }

      e.preventDefault();

      setPosition((prev) => {
        let { x, y } = prev;

        const speed = 10;

        if (e.key === "ArrowUp") {
          y -= speed;
        }

        if (e.key === "ArrowDown") {
          y += speed;
        }

        if (e.key === "ArrowLeft") {
          x -= speed;
        }

        if (e.key === "ArrowRight") {
          x += speed;
        }

        x = Math.max(
          0,
          Math.min(x, 1150)
        );

        y = Math.max(
          0,
          Math.min(y, 650)
        );

        if (checkCollision(x, y)) {
          return prev;
        }

        if (socket.connected) {
          socket.emit(
            "avatar:move",
            {
              userId,
              x,
              y,
            }
          );
        }

        return {
          x,
          y,
        };
      });
    };

    window.addEventListener(
      "keydown",
      handleKey
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKey
      );
    };
  }, [userId]);

  // ================= USERS =================

  const otherUsers = users.filter(
    (user) =>
      user.userId !== userId
  );

  // ================= CHAT =================

  const handleSendMessage = (message) => {
    console.log(
      "Chat message:",
      message
    );

    // Temporary UI test
    // Real Socket.io chat will be connected
    // after confirming friend's backend event.
  };

  return (
    <div className="flex-1 relative overflow-hidden bg-slate-900 pb-16 lg:pb-0">

      {/* ================= FLOOR ================= */}

      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(
              90deg,
              #3b3b3b 1px,
              transparent 1px
            ),
            linear-gradient(
              #3b3b3b 1px,
              transparent 1px
            ),
            linear-gradient(
              135deg,
              #2f343c,
              #23272f
            )
          `,
          backgroundSize:
            "80px 80px, 80px 80px, 100% 100%",
        }}
      />

      {/* Floor Lighting */}

      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10 pointer-events-none" />

      {/* ================= ONLINE USERS ================= */}

      <OnlineUsers
        users={otherUsers}
      />

      {/* ================= FURNITURE ================= */}

      <Furniture />

      {/* ================= YOUR AVATAR ================= */}

      <Avatar
        x={position.x}
        y={position.y}
        name={username}
      />

      {/* ================= OTHER USERS ================= */}

      {otherUsers.map((user) => (
        <Avatar
          key={user.userId}
          x={
            user.position?.x ??
            400
          }
          y={
            user.position?.y ??
            300
          }
          name={user.name}
        />
      ))}

      {/* ================= CHAT ================= */}

      <ChatBox
        messages={[]}
        onSend={handleSendMessage}
      />

      {/* ================= MINI MAP ================= */}

      <div className="hidden lg:block">
        <MiniMap
          position={position}
          users={otherUsers.map(
            (user) => ({
              id: user.userId,
              x:
                user.position?.x ??
                400,
              y:
                user.position?.y ??
                300,
              name: user.name,
            })
          )}
        />
      </div>

    </div>
  );
}

export default OfficeCanvas;