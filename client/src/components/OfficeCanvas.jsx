import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import Furniture from "./Furniture";
import MiniMap from "./MiniMap";
import socket from "../socket";

function OfficeCanvas() {
  const [position, setPosition] = useState({
    x: 200,
    y: 150,
  });

  const [users, setUsers] = useState([]);

  const username = localStorage.getItem("username") || "Guest";

  // Create a unique user ID
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
    { x: 350, y: 180, width: 140, height: 80 },
    { x: 650, y: 320, width: 140, height: 80 },
    { x: 100, y: 430, width: 220, height: 140 },
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

  // Socket connection
  useEffect(() => {
    socket.connect();

    // Join office
    socket.emit("user:join", {
      userId,
      name: username,
      x: position.x,
      y: position.y,
    });

    // Receive online users
    socket.on("users:list", (onlineUsers) => {
      setUsers(onlineUsers);
    });

    // Someone joined
    socket.on("user:joined", (user) => {
      setUsers((prev) => {
        const exists = prev.some(
          (item) => item.userId === user.userId
        );

        if (exists) {
          return prev;
        }

        return [...prev, user];
      });
    });

    // Someone moved
    socket.on("avatar:moved", (data) => {
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
    });

    // Someone left
    socket.on("user:left", (data) => {
      setUsers((prev) =>
        prev.filter((user) => user.userId !== data.userId)
      );
    });

    // Server error
    socket.on("server:error", (data) => {
      console.error("Server error:", data.message);
    });

    return () => {
      socket.off("users:list");
      socket.off("user:joined");
      socket.off("avatar:moved");
      socket.off("user:left");
      socket.off("server:error");

      socket.disconnect();
    };
  }, []);

  // Keyboard movement
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

        // Canvas boundary
        x = Math.max(0, Math.min(x, 1150));
        y = Math.max(0, Math.min(y, 650));

        // Collision
        if (checkCollision(x, y)) {
          return prev;
        }

        // Send movement to server
        socket.emit("avatar:move", {
          userId,
          x,
          y,
        });

        return { x, y };
      });
    };

    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [userId]);

  return (
    <div className="flex-1 relative overflow-hidden bg-slate-900 pb-16 lg:pb-0">

      {/* Office Floor */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(90deg, #3b3b3b 1px, transparent 1px),
            linear-gradient(#3b3b3b 1px, transparent 1px),
            linear-gradient(135deg, #2f343c, #23272f)
          `,
          backgroundSize:
            "80px 80px, 80px 80px, 100% 100%",
        }}
      />

      {/* Floor Lighting */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10 pointer-events-none" />

      {/* Furniture */}
      <Furniture />

      {/* Your Avatar */}
      <Avatar
        x={position.x}
        y={position.y}
        name={username}
      />

      {/* Online Users */}
      {users
        .filter((user) => user.userId !== userId)
        .map((user) => (
          <Avatar
            key={user.userId}
            x={user.position?.x ?? 400}
            y={user.position?.y ?? 300}
            name={user.name}
          />
        ))}

      {/* Mini Map */}
      <div className="hidden lg:block">
        <MiniMap
          position={position}
          users={users
            .filter((user) => user.userId !== userId)
            .map((user) => ({
              id: user.userId,
              x: user.position?.x ?? 400,
              y: user.position?.y ?? 300,
              name: user.name,
            }))}
        />
      </div>

    </div>
  );
}

export default OfficeCanvas;