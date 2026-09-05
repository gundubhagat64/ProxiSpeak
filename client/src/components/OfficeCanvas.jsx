import { useEffect, useState } from "react";

import Avatar from "./Avatar";
import Furniture from "./Furniture";
import MiniMap from "./MiniMap";
import OnlineUsers from "./OnlineUsers";
import ChatBox from "./ChatBox";
import ProximityVoice from "./ProximityVoice";
import VoiceControls from "./VoiceControls";
import socket from "../socket";

function OfficeCanvas() {
  const [position, setPosition] = useState({
    x: 200,
    y: 150,
  });

  const [users, setUsers] = useState([]);

  // Users detected by backend proximity query
  const [nearbyUsers, setNearbyUsers] = useState([]);

  // Office layout loaded from MongoDB
  const [officeLayout, setOfficeLayout] = useState({
    width: 1150,
    height: 650,
    spawnPoint: {
      x: 200,
      y: 150,
    },
    furniture: [],
    obstacles: [],
  });

  // Chat messages
  const [messages, setMessages] = useState([]);

  const username =
    localStorage.getItem("username") || "Guest";

  // ================= USER STATUS =================

  const [userStatus, setUserStatus] = useState("Online");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ================= USER ID =================

  const [userId] = useState(() => {
    let id = localStorage.getItem("userId");

    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("userId", id);
    }

    return id;
  });

  // Current MongoDB room
  const roomId = "6a9c6a89f703548eca1e9415";

  // ================= OFFICE LAYOUT =================

  const obstacles = officeLayout.obstacles || [];
  const furniture = officeLayout.furniture || [];

  // ================= COLLISION DETECTION =================

  const checkCollision = (x, y) => {
    const avatarSize = 40;

    const collisionObjects = [
      ...obstacles,
      ...furniture,
    ];

    return collisionObjects.some((obj) => {
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
        roomId,
        x: position.x,
        y: position.y,
      });

      console.log(
        "Join request sent:",
        username
      );
    };

    const handleConnectError = (error) => {
      console.error(
        "❌ Socket connection error:",
        error.message
      );
    };

    // ================= USERS LIST =================

    const handleUsersList = (onlineUsers) => {
      console.log(
        "Online users:",
        onlineUsers
      );

      setUsers(onlineUsers);
    };

    // ================= USER JOINED =================

    const handleUserJoined = (user) => {
      console.log(
        "User joined:",
        user
      );

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

    // ================= AVATAR MOVED =================

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

    // ================= OFFICE LAYOUT =================

    const handleOfficeLayout = (layout) => {
      console.log(
        "🏢 Office layout received:",
        layout
      );

      if (!layout) {
        return;
      }

      setOfficeLayout({
        width: layout.width || 1150,

        height:
          layout.height || 650,

        spawnPoint:
          layout.spawnPoint || {
            x: 200,
            y: 150,
          },

        furniture:
          Array.isArray(layout.furniture)
            ? layout.furniture
            : [],

        obstacles:
          Array.isArray(layout.obstacles)
            ? layout.obstacles
            : [],
      });

      // Use server-defined spawn point
      if (layout.spawnPoint) {
        setPosition({
          x:
            layout.spawnPoint.x ??
            200,

          y:
            layout.spawnPoint.y ??
            150,
        });
      }
    };

    // ================= PROXIMITY =================

    const handleProximityUpdate = (data) => {
      console.log(
        "📍 Proximity update:",
        data
      );

      setNearbyUsers(
        data.nearbyUsers || []
      );
    };

    // ================= CHAT RECEIVE =================

    const handleChatReceive = (message) => {
      console.log(
        "💬 Chat message received:",
        message
      );

      setMessages((prev) => [
        ...prev,
        message,
      ]);
    };

    // ================= USER LEFT =================

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

      setNearbyUsers((prev) =>
        prev.filter(
          (user) =>
            user.userId !== data.userId
        )
      );
    };

    // ================= SERVER ERROR =================

    const handleServerError = (data) => {
      console.error(
        "Server error:",
        data.message
      );
    };

    // ================= REGISTER LISTENERS =================

    socket.on(
      "connect",
      handleConnect
    );

    socket.on(
      "connect_error",
      handleConnectError
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
      "office:layout",
      handleOfficeLayout
    );

    socket.on(
      "proximity:update",
      handleProximityUpdate
    );

    socket.on(
      "chat:receive",
      handleChatReceive
    );

    socket.on(
      "user:left",
      handleUserLeft
    );

    socket.on(
      "server:error",
      handleServerError
    );

    // ================= CONNECT =================

    if (!socket.connected) {
      socket.connect();
    } else {
      handleConnect();
    }

    // ================= CLEANUP =================

    return () => {
      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "connect_error",
        handleConnectError
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
        "office:layout",
        handleOfficeLayout
      );

      socket.off(
        "proximity:update",
        handleProximityUpdate
      );

      socket.off(
        "chat:receive",
        handleChatReceive
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
  }, [
    userId,
    username,
    roomId,
  ]);

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

        // Movement
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

        // ================= BOUNDARY =================

        const avatarSize = 40;

        const maxX = Math.max(
          0,
          officeLayout.width -
            avatarSize
        );

        const maxY = Math.max(
          0,
          officeLayout.height -
            avatarSize
        );

        x = Math.max(
          0,
          Math.min(x, maxX)
        );

        y = Math.max(
          0,
          Math.min(y, maxY)
        );

        // ================= COLLISION =================

        if (checkCollision(x, y)) {
          return prev;
        }

        // ================= SEND MOVEMENT =================

        if (socket.connected) {
          socket.emit(
            "avatar:move",
            {
              userId,
              roomId,
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
  }, [
    userId,
    roomId,
    officeLayout.width,
    officeLayout.height,
    obstacles,
    furniture,
  ]);

  // ================= USERS =================

  const otherUsers = users.filter(
    (user) =>
      user.userId !== userId
  );

  // ================= CHAT =================

  const handleSendMessage = (
    message
  ) => {
    const text = message.trim();

    if (!text) {
      return;
    }

    const newMessage = {
      id: crypto.randomUUID(),
      userId,
      name: username,
      text,
      timestamp:
        new Date().toISOString(),
    };

    // Show immediately
    setMessages((prev) => [
      ...prev,
      newMessage,
    ]);

    // Send backend
    if (socket.connected) {
      socket.emit(
        "chat:send",
        newMessage
      );
    }

    console.log(
      "💬 Chat message:",
      newMessage
    );
  };

  // ================= UI =================

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

      {/* ================= FLOOR LIGHTING ================= */}

      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10 pointer-events-none" />

      {/* ================= STATUS BAR ================= */}

      <div className="absolute top-4 right-4 z-50 flex items-center gap-3">

        {/* Live Clock */}

        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/90 backdrop-blur-md border border-slate-700 shadow-lg">

          <span className="text-sm">
            🕐
          </span>

          <span className="text-white text-sm font-semibold">
            {currentTime.toLocaleTimeString(
              [],
              {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }
            )}
          </span>

        </div>

        {/* User Status */}

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/90 backdrop-blur-md border border-slate-700 shadow-lg">

          <span
            className={`w-2.5 h-2.5 rounded-full ${
              userStatus === "Online"
                ? "bg-green-400"
                : userStatus === "Busy"
                ? "bg-red-400"
                : "bg-yellow-400"
            }`}
          />

          <select
            value={userStatus}
            onChange={(e) =>
              setUserStatus(
                e.target.value
              )
            }
            className="bg-transparent text-white text-sm font-medium outline-none cursor-pointer"
          >
            <option
              value="Online"
              className="bg-slate-800"
            >
              Online
            </option>

            <option
              value="Busy"
              className="bg-slate-800"
            >
              Busy
            </option>

            <option
              value="Away"
              className="bg-slate-800"
            >
              Away
            </option>
          </select>

        </div>
      </div>

      {/* ================= ONLINE USERS ================= */}

      <OnlineUsers
        users={otherUsers}
      />

      {/* ================= SOUND / PHYSICAL OBSTACLES ================= */}

      {obstacles.map(
        (obstacle) => (
          <div
            key={
              obstacle._id ||
              `obstacle-${obstacle.x}-${obstacle.y}`
            }
            className="absolute pointer-events-none"
            style={{
              left: obstacle.x,
              top: obstacle.y,
              width: obstacle.width,
              height: obstacle.height,

              background:
                obstacle.type === "wall"
                  ? "rgba(100, 116, 139, 0.95)"
                  : "rgba(71, 85, 105, 0.75)",

              border:
                obstacle.blocksSound
                  ? "2px solid rgba(248, 113, 113, 0.8)"
                  : "1px solid rgba(148, 163, 184, 0.5)",

              borderRadius:
                obstacle.type === "wall"
                  ? 2
                  : 6,
            }}
          />
        )
      )}

      {/* ================= FURNITURE ================= */}

      <Furniture
        items={furniture}
      />

      {/* ================= YOUR AVATAR ================= */}

      <Avatar
        x={position.x}
        y={position.y}
        name={username}
      />

      {/* ================= OTHER USERS ================= */}

      {otherUsers.map(
        (user) => (
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
            isNearby={nearbyUsers.some(
              (nearbyUser) =>
                nearbyUser.userId ===
                user.userId
            )}
          />
        )
      )}

      {/* ================= CHAT ================= */}

      <ChatBox
        messages={messages}
        onSend={handleSendMessage}
        username={username}
      />

      {/* ================= PROXIMITY VOICE ================= */}

      <ProximityVoice
        userId={userId}
        localPosition={position}
        nearbyUsers={nearbyUsers}
      />

      {/* ================= VOICE CONTROLS ================= */}

      <VoiceControls />

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