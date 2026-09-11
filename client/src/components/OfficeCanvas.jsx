import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import socket from "../socket";
import WebRTCManager from "../services/WebRTCManager";
import SpatialAudio from "../services/SpatialAudio";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import OnlineUsers from "./OnlineUsers";
import Furniture from "./Furniture";
import Avatar from "./Avatar";
import ChatBox from "./ChatBox";
import ProximityVoice from "./ProximityVoice";
import VoiceControls from "./VoiceControls";
import MiniMap from "./MiniMap";

const WORLD_WIDTH = 1150;
const WORLD_HEIGHT = 650;

const MOVE_SPEED = 5;
const HEARING_DISTANCE = 100;

const INITIAL_POSITION = {
  x: 200,
  y: 150,
};

// ------------------------------------------------------------
// OfficeCanvas
// ------------------------------------------------------------

function OfficeCanvas() {
  // ==========================================================
  // STATE
  // ==========================================================

  const [position, setPosition] =
    useState(INITIAL_POSITION);

  const [users, setUsers] =
    useState([]);

  const [nearbyUsers, setNearbyUsers] =
    useState([]);

  const [messages, setMessages] =
    useState([]);

  const [remoteStreams, setRemoteStreams] =
    useState({});

  const [isMuted, setIsMuted] =
    useState(false);

  const [isConnected, setIsConnected] =
    useState(false);

  const [micEnabled, setMicEnabled] =
    useState(false);

  // ==========================================================
  // REFS
  // ==========================================================

  const userIdRef =
    useRef(null);

  const usernameRef =
    useRef(null);

  const positionRef =
    useRef(INITIAL_POSITION);

  const usersRef =
    useRef([]);

  const nearbyUsersRef =
    useRef([]);

  const webRTCRef =
    useRef(null);

  const spatialAudioRef =
    useRef(null);

  const localStreamRef =
    useRef(null);

  const animationFrameRef =
    useRef(null);

  const keysRef =
    useRef({});

  const mountedRef =
    useRef(false);

  // ==========================================================
  // USER ID
  // ==========================================================

  useEffect(() => {
    let savedUserId =
      localStorage.getItem(
        "proxispeak_user_id"
      );

    if (!savedUserId) {
      savedUserId =
        crypto.randomUUID();

      localStorage.setItem(
        "proxispeak_user_id",
        savedUserId
      );
    }

    userIdRef.current =
      savedUserId;

    const savedName =
      localStorage.getItem(
        "proxispeak_username"
      );

    usernameRef.current =
      savedName ||
      `User-${savedUserId.slice(
        0,
        5
      )}`;
  }, []);

  // ==========================================================
  // KEEP REFS IN SYNC
  // ==========================================================

  useEffect(() => {
    positionRef.current =
      position;
  }, [position]);

  useEffect(() => {
    usersRef.current =
      users;
  }, [users]);

  useEffect(() => {
    nearbyUsersRef.current =
      nearbyUsers;
  }, [nearbyUsers]);

  // ==========================================================
  // INITIALIZE SPATIAL AUDIO
  // ==========================================================

  useEffect(() => {
    spatialAudioRef.current =
      new SpatialAudio();

    spatialAudioRef.current.initialize();

    return () => {
      spatialAudioRef.current?.destroy();
      spatialAudioRef.current =
        null;
    };
  }, []);

  // ==========================================================
  // REMOTE AUDIO CALLBACK
  // ==========================================================

  const handleRemoteStream =
    useCallback(
      (remoteUserId, stream) => {
        if (!remoteUserId || !stream) {
          return;
        }

        console.log(
          "Remote stream:",
          remoteUserId
        );

        setRemoteStreams(
          (previous) => ({
            ...previous,
            [remoteUserId]: stream,
          })
        );

        // Create Web Audio pipeline.
        if (spatialAudioRef.current) {
          spatialAudioRef.current.createRemoteAudio(
            remoteUserId,
            stream
          );

          const remoteUser =
            nearbyUsersRef.current.find(
              (user) =>
                user.userId ===
                remoteUserId
            );

          if (remoteUser) {
            spatialAudioRef.current.updateRemoteAudio(
              remoteUserId,
              positionRef.current,
              remoteUser.position
            );
          }
        }
      },
      []
    );

  // ==========================================================
  // PEER LEFT CALLBACK
  // ==========================================================

  const handlePeerLeft =
    useCallback(
      (remoteUserId) => {
        if (!remoteUserId) {
          return;
        }

        console.log(
          "Peer left:",
          remoteUserId
        );

        spatialAudioRef.current?.removeRemoteAudio(
          remoteUserId
        );

        setRemoteStreams(
          (previous) => {
            const updated = {
              ...previous,
            };

            delete updated[
              remoteUserId
            ];

            return updated;
          }
        );
      },
      []
    );

  // ==========================================================
  // GET MICROPHONE
  // ==========================================================

  const startMicrophone =
    useCallback(async () => {
      try {
        if (
          localStreamRef.current
        ) {
          return localStreamRef.current;
        }

        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices
            .getUserMedia
        ) {
          console.error(
            "getUserMedia is not supported."
          );

          return null;
        }

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
              video: false,
            }
          );

        localStreamRef.current =
          stream;

        setMicEnabled(true);

        if (webRTCRef.current) {
          webRTCRef.current.setLocalStream(
            stream
          );
        }

        return stream;
      } catch (error) {
        console.error(
          "Microphone permission error:",
          error
        );

        setMicEnabled(false);

        return null;
      }
    }, []);

  // ==========================================================
  // INITIALIZE WEBRTC
  // ==========================================================

  useEffect(() => {
    if (!userIdRef.current) {
      return;
    }

    const manager =
      new WebRTCManager(
        socket,
        userIdRef.current,
        handleRemoteStream,
        handlePeerLeft
      );

    webRTCRef.current =
      manager;

    if (localStreamRef.current) {
      manager.setLocalStream(
        localStreamRef.current
      );
    }

    return () => {
      manager.close();

      webRTCRef.current =
        null;
    };
  }, [
    handleRemoteStream,
    handlePeerLeft,
  ]);

  // ==========================================================
  // START MICROPHONE AFTER USER INTERACTION
  // ==========================================================

  const enableVoice =
    useCallback(async () => {
      const stream =
        await startMicrophone();

      if (!stream) {
        return;
      }

      await spatialAudioRef.current?.resume();

      setMicEnabled(true);
    }, [
      startMicrophone,
    ]);

  // ==========================================================
  // SOCKET CONNECTION
  // ==========================================================

  useEffect(() => {
    mountedRef.current =
      true;

    if (!userIdRef.current) {
      return;
    }

    const handleConnect =
      async () => {
        if (!mountedRef.current) {
          return;
        }

        console.log(
          "Socket connected:",
          socket.id
        );

        setIsConnected(true);

        const userId =
          userIdRef.current;

        const name =
          usernameRef.current;

        socket.emit(
          "user:join",
          {
            userId,
            name,
            x: positionRef.current.x,
            y: positionRef.current.y,
          },
          (response) => {
            console.log(
              "Join response:",
              response
            );
          }
        );

        // Ask for microphone.
        // Browser will show permission popup.
        await startMicrophone();
      };

    const handleDisconnect =
      () => {
        console.log(
          "Socket disconnected"
        );

        setIsConnected(false);
      };

    // --------------------------------------------------------
    // USERS LIST
    // --------------------------------------------------------

    const handleUsersList =
      (onlineUsers) => {
        if (!Array.isArray(onlineUsers)) {
          return;
        }

        const filtered =
          onlineUsers.filter(
            (user) =>
              user.userId !==
              userIdRef.current
          );

        setUsers(filtered);
      };

    // --------------------------------------------------------
    // USER JOINED
    // --------------------------------------------------------

    const handleUserJoined =
      (user) => {
        if (
          !user ||
          user.userId ===
            userIdRef.current
        ) {
          return;
        }

        setUsers(
          (previous) => {
            const exists =
              previous.some(
                (item) =>
                  item.userId ===
                  user.userId
              );

            if (exists) {
              return previous.map(
                (item) =>
                  item.userId ===
                  user.userId
                    ? {
                        ...item,
                        ...user,
                      }
                    : item
              );
            }

            return [
              ...previous,
              user,
            ];
          }
        );
      };

    // --------------------------------------------------------
    // AVATAR MOVED
    // --------------------------------------------------------

    const handleAvatarMoved =
      ({
        userId,
        x,
        y,
      }) => {
        if (
          !userId ||
          userId ===
            userIdRef.current
        ) {
          return;
        }

        setUsers(
          (previous) =>
            previous.map(
              (user) =>
                user.userId ===
                userId
                  ? {
                      ...user,
                      position: {
                        x,
                        y,
                      },
                    }
                  : user
            )
        );

        setNearbyUsers(
          (previous) =>
            previous.map(
              (user) =>
                user.userId ===
                userId
                  ? {
                      ...user,
                      position: {
                        x,
                        y,
                      },
                    }
                  : user
            )
        );
      };

    // --------------------------------------------------------
    // PROXIMITY UPDATE
    // --------------------------------------------------------

    const handleProximityUpdate =
      (nearby) => {
        if (!Array.isArray(nearby)) {
          return;
        }

        const filtered =
          nearby.filter(
            (user) =>
              user.userId !==
              userIdRef.current
          );

        setNearbyUsers(
          filtered
        );

        // Start WebRTC for deterministic initiator.
        for (const peer of filtered) {
          if (
            !peer?.userId ||
            !peer?.socketId
          ) {
            continue;
          }

          if (
            userIdRef.current <
            peer.userId
          ) {
            webRTCRef.current?.createOffer(
              peer.userId,
              peer.socketId
            );
          }
        }
      };

    // --------------------------------------------------------
    // PEER NEARBY
    // --------------------------------------------------------

    const handlePeerNearby =
      (peer) => {
        if (
          !peer?.userId ||
          peer.userId ===
            userIdRef.current
        ) {
          return;
        }

        console.log(
          "Peer nearby:",
          peer
        );

        // Update user position.
        setUsers(
          (previous) =>
            previous.map(
              (user) =>
                user.userId ===
                peer.userId
                  ? {
                      ...user,
                      name:
                        peer.name ||
                        user.name,
                      position:
                        peer.position ||
                        user.position,
                      socketId:
                        peer.socketId,
                    }
                  : user
            )
        );

        // Deterministic initiator.
        if (
          peer.socketId &&
          userIdRef.current <
            peer.userId
        ) {
          webRTCRef.current?.createOffer(
            peer.userId,
            peer.socketId
          );
        }
      };

    // --------------------------------------------------------
    // PEER LEFT
    // --------------------------------------------------------

    const handlePeerLeft =
      ({
        userId,
      }) => {
        if (!userId) {
          return;
        }

        webRTCRef.current?.removePeer(
          userId
        );

        spatialAudioRef.current?.removeRemoteAudio(
          userId
        );

        setRemoteStreams(
          (previous) => {
            const updated = {
              ...previous,
            };

            delete updated[userId];

            return updated;
          }
        );

        setNearbyUsers(
          (previous) =>
            previous.filter(
              (user) =>
                user.userId !==
                userId
            )
        );
      };

    // --------------------------------------------------------
    // USER LEFT
    // --------------------------------------------------------

    const handleUserLeft =
      ({
        userId,
      }) => {
        if (!userId) {
          return;
        }

        setUsers(
          (previous) =>
            previous.filter(
              (user) =>
                user.userId !==
                userId
            )
        );

        setNearbyUsers(
          (previous) =>
            previous.filter(
              (user) =>
                user.userId !==
                userId
            )
        );

        webRTCRef.current?.removePeer(
          userId
        );

        spatialAudioRef.current?.removeRemoteAudio(
          userId
        );

        setRemoteStreams(
          (previous) => {
            const updated = {
              ...previous,
            };

            delete updated[userId];

            return updated;
          }
        );
      };

    // --------------------------------------------------------
    // CHAT
    // --------------------------------------------------------

    const handleChatReceive =
      (message) => {
        if (!message) {
          return;
        }

        setMessages(
          (previous) => [
            ...previous,
            message,
          ]
        );
      };

    // --------------------------------------------------------
    // SERVER ERROR
    // --------------------------------------------------------

    const handleServerError =
      ({
        message,
      }) => {
        console.error(
          "Server error:",
          message
        );
      };

    // --------------------------------------------------------
    // REGISTER
    // --------------------------------------------------------

    socket.on(
      "connect",
      handleConnect
    );

    socket.on(
      "disconnect",
      handleDisconnect
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
      "proximity:update",
      handleProximityUpdate
    );

    socket.on(
      "proximity:peer-nearby",
      handlePeerNearby
    );

    socket.on(
      "webrtc:peer-left",
      handlePeerLeft
    );

    socket.on(
      "user:left",
      handleUserLeft
    );

    socket.on(
      "chat:receive",
      handleChatReceive
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

    // --------------------------------------------------------
    // CLEANUP
    // --------------------------------------------------------

    return () => {
      mountedRef.current =
        false;

      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "disconnect",
        handleDisconnect
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
        "proximity:update",
        handleProximityUpdate
      );

      socket.off(
        "proximity:peer-nearby",
        handlePeerNearby
      );

      socket.off(
        "webrtc:peer-left",
        handlePeerLeft
      );

      socket.off(
        "user:left",
        handleUserLeft
      );

      socket.off(
        "chat:receive",
        handleChatReceive
      );

      socket.off(
        "server:error",
        handleServerError
      );

      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [
    startMicrophone,
  ]);

  // ==========================================================
  // UPDATE SPATIAL AUDIO
  // ==========================================================

  useEffect(() => {
    const audio =
      spatialAudioRef.current;

    if (!audio) {
      return;
    }

    for (const peer of nearbyUsers) {
      if (!peer?.userId) {
        continue;
      }

      if (!peer?.position) {
        continue;
      }

      audio.updateRemoteAudio(
        peer.userId,
        position,
        peer.position
      );
    }

    // Remove audio for peers no longer nearby.
    const nearbyIds =
      new Set(
        nearbyUsers.map(
          (user) =>
            user.userId
        )
      );

    for (const userId of Object.keys(
      remoteStreams
    )) {
      if (!nearbyIds.has(userId)) {
        audio.removeRemoteAudio(
          userId
        );
      }
    }
  }, [
    position,
    nearbyUsers,
    remoteStreams,
  ]);

  // ==========================================================
  // MOVE AVATAR
  // ==========================================================

  const moveAvatar =
    useCallback(
      (dx, dy) => {
        const current =
          positionRef.current;

        const newX = Math.max(
          0,
          Math.min(
            WORLD_WIDTH,
            current.x + dx
          )
        );

        const newY = Math.max(
          0,
          Math.min(
            WORLD_HEIGHT,
            current.y + dy
          )
        );

        if (
          newX === current.x &&
          newY === current.y
        ) {
          return;
        }

        const newPosition = {
          x: newX,
          y: newY,
        };

        positionRef.current =
          newPosition;

        setPosition(
          newPosition
        );

        if (socket.connected) {
          socket.emit(
            "avatar:move",
            {
              userId:
                userIdRef.current,
              x: newX,
              y: newY,
            }
          );
        }
      },
      []
    );

  // ==========================================================
  // KEYBOARD HANDLING
  // ==========================================================

  useEffect(() => {
    const handleKeyDown =
      (event) => {
        const key =
          event.key.toLowerCase();

        if (
          [
            "arrowup",
            "arrowdown",
            "arrowleft",
            "arrowright",
            "w",
            "a",
            "s",
            "d",
          ].includes(key)
        ) {
          event.preventDefault();

          keysRef.current[key] =
            true;
        }
      };

    const handleKeyUp =
      (event) => {
        const key =
          event.key.toLowerCase();

        keysRef.current[key] =
          false;
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    window.addEventListener(
      "keyup",
      handleKeyUp
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

      window.removeEventListener(
        "keyup",
        handleKeyUp
      );
    };
  }, []);

  // ==========================================================
  // 60 FPS MOVEMENT LOOP
  // ==========================================================

  useEffect(() => {
    let lastTime =
      performance.now();

    const animationLoop =
      (currentTime) => {
        const delta =
          Math.min(
            currentTime -
              lastTime,
            50
          );

        lastTime =
          currentTime;

        const keys =
          keysRef.current;

        let dx = 0;
        let dy = 0;

        if (
          keys.arrowup ||
          keys.w
        ) {
          dy -= 1;
        }

        if (
          keys.arrowdown ||
          keys.s
        ) {
          dy += 1;
        }

        if (
          keys.arrowleft ||
          keys.a
        ) {
          dx -= 1;
        }

        if (
          keys.arrowright ||
          keys.d
        ) {
          dx += 1;
        }

        if (dx !== 0 || dy !== 0) {
          const length =
            Math.sqrt(
              dx * dx +
                dy * dy
            );

          dx /= length;
          dy /= length;

          const distance =
            MOVE_SPEED *
            (delta / 16.67);

          moveAvatar(
            dx * distance,
            dy * distance
          );
        }

        animationFrameRef.current =
          requestAnimationFrame(
            animationLoop
          );
      };

    animationFrameRef.current =
      requestAnimationFrame(
        animationLoop
      );

    return () => {
      if (
        animationFrameRef.current
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );
      }
    };
  }, [
    moveAvatar,
  ]);

  // ==========================================================
  // CHAT SEND
  // ==========================================================

  const sendMessage =
    useCallback(
      (message) => {
        if (
          typeof message !==
          "string"
        ) {
          return;
        }

        const cleanMessage =
          message.trim();

        if (!cleanMessage) {
          return;
        }

        socket.emit(
          "chat:send",
          {
            message:
              cleanMessage,
          }
        );
      },
      []
    );

  // ==========================================================
  // MUTE / UNMUTE
  // ==========================================================

  const toggleMute =
    useCallback(() => {
      const stream =
        localStreamRef.current;

      if (!stream) {
        enableVoice();
        return;
      }

      const newMuted =
        !isMuted;

      stream
        .getAudioTracks()
        .forEach(
          (track) => {
            track.enabled =
              !newMuted;
          }
        );

      setIsMuted(
        newMuted
      );
    }, [
      isMuted,
      enableVoice,
    ]);

  // ==========================================================
  // MANUAL VOICE BUTTON
  // ==========================================================

  const handleVoiceToggle =
    useCallback(async () => {
      if (
        !localStreamRef.current
      ) {
        await enableVoice();
        return;
      }

      toggleMute();
    }, [
      enableVoice,
      toggleMute,
    ]);

  // ==========================================================
  // CLICK TO MOVE
  // ==========================================================

  const handleOfficeClick =
    useCallback(
      (event) => {
        const rect =
          event.currentTarget.getBoundingClientRect();

        const x =
          event.clientX -
          rect.left;

        const y =
          event.clientY -
          rect.top;

        const targetX =
          Math.max(
            0,
            Math.min(
              WORLD_WIDTH,
              x
            )
          );

        const targetY =
          Math.max(
            0,
            Math.min(
              WORLD_HEIGHT,
              y
            )
          );

        positionRef.current =
          {
            x: targetX,
            y: targetY,
          };

        setPosition(
          positionRef.current
        );

        if (socket.connected) {
          socket.emit(
            "avatar:move",
            {
              userId:
                userIdRef.current,
              x: targetX,
              y: targetY,
            }
          );
        }
      },
      []
    );

  // ==========================================================
  // OBSTACLES
  // ==========================================================

  const obstacles = [
    {
      id: "wall-1",
      x: 360,
      y: 80,
      width: 20,
      height: 220,
    },
    {
      id: "wall-2",
      x: 700,
      y: 300,
      width: 20,
      height: 220,
    },
  ];

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      className="proxispeak-app"
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <Navbar />

      {/* ======================================================
          MAIN AREA
      ====================================================== */}

      <div
        style={{
          flex: 1,
          display: "flex",
          minHeight: 0,
        }}
      >
        {/* ====================================================
            LEFT SIDEBAR
        ==================================================== */}

        <Sidebar />

        {/* ====================================================
            OFFICE
        ==================================================== */}

        <main
          style={{
            flex: 1,
            position: "relative",
            overflow: "auto",
            background:
              "#e5e7eb",
            padding: "20px",
          }}
        >
          {/* ==================================================
              OFFICE WORLD
          ================================================== */}

          <div
            className="office-world"
            onClick={
              handleOfficeClick
            }
            style={{
              position:
                "relative",
              width:
                `${WORLD_WIDTH}px`,
              height:
                `${WORLD_HEIGHT}px`,
              minWidth:
                `${WORLD_WIDTH}px`,
              minHeight:
                `${WORLD_HEIGHT}px`,
              margin:
                "0 auto",
              background:
                "#f8fafc",
              border:
                "2px solid #cbd5e1",
              borderRadius:
                "12px",
              overflow:
                "hidden",
              boxShadow:
                "0 10px 30px rgba(0,0,0,0.12)",
            }}
          >
            {/* =================================================
                GRID
            ================================================= */}

            <div
              style={{
                position:
                  "absolute",
                inset: 0,
                pointerEvents:
                  "none",
                opacity: 0.45,
                backgroundImage:
                  "linear-gradient(#dbe3ea 1px, transparent 1px), linear-gradient(90deg, #dbe3ea 1px, transparent 1px)",
                backgroundSize:
                  "25px 25px",
              }}
            />

            {/* =================================================
                TITLE
            ================================================= */}

            <div
              style={{
                position:
                  "absolute",
                top: "12px",
                left: "16px",
                zIndex: 10,
                background:
                  "rgba(255,255,255,0.9)",
                padding:
                  "6px 12px",
                borderRadius:
                  "8px",
                fontSize:
                  "14px",
                fontWeight:
                  "600",
                pointerEvents:
                  "none",
              }}
            >
              ProxiSpeak Office
            </div>

            {/* =================================================
                CONNECTION STATUS
            ================================================= */}

            <div
              style={{
                position:
                  "absolute",
                top: "12px",
                right: "16px",
                zIndex: 10,
                background:
                  "rgba(255,255,255,0.9)",
                padding:
                  "6px 12px",
                borderRadius:
                  "8px",
                fontSize:
                  "12px",
                pointerEvents:
                  "none",
              }}
            >
              <span>
                {isConnected
                  ? "🟢 Connected"
                  : "🔴 Disconnected"}
              </span>
            </div>

            {/* =================================================
                FURNITURE
            ================================================= */}

            <Furniture />

            {/* =================================================
                SIMPLE SOUND-BLOCKING WALLS
            ================================================= */}

            {obstacles.map(
              (obstacle) => (
                <div
                  key={
                    obstacle.id
                  }
                  style={{
                    position:
                      "absolute",
                    left:
                      `${obstacle.x}px`,
                    top:
                      `${obstacle.y}px`,
                    width:
                      `${obstacle.width}px`,
                    height:
                      `${obstacle.height}px`,
                    background:
                      "#64748b",
                    borderRadius:
                      "4px",
                    zIndex: 4,
                    pointerEvents:
                      "none",
                  }}
                />
              )
            )}

            {/* =================================================
                OTHER USERS
            ================================================= */}

            {users.map(
              (user) => (
                <div
                  key={
                    user.userId
                  }
                  style={{
                    position:
                      "absolute",
                    left:
                      `${user.position?.x || 0}px`,
                    top:
                      `${user.position?.y || 0}px`,
                    transform:
                      "translate(-50%, -50%)",
                    zIndex: 20,
                    pointerEvents:
                      "none",
                  }}
                >
                  <div
                    style={{
                      background:
                        "rgba(37,99,235,0.9)",
                      color:
                        "white",
                      padding:
                        "4px 8px",
                      borderRadius:
                        "10px",
                      fontSize:
                        "11px",
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    {user.name}
                  </div>

                  <div
                    style={{
                      width:
                        "28px",
                      height:
                        "28px",
                      margin:
                        "4px auto 0",
                      borderRadius:
                        "50%",
                      background:
                        "#3b82f6",
                      border:
                        "3px solid white",
                      boxShadow:
                        "0 2px 8px rgba(0,0,0,0.2)",
                    }}
                  />
                </div>
              )
            )}

            {/* =================================================
                CURRENT USER AVATAR
            ================================================= */}

            <div
              style={{
                position:
                  "absolute",
                left:
                  `${position.x}px`,
                top:
                  `${position.y}px`,
                transform:
                  "translate(-50%, -50%)",
                zIndex: 30,
                pointerEvents:
                  "none",
              }}
            >
              <div
                style={{
                  background:
                    "rgba(16,185,129,0.95)",
                  color:
                    "white",
                  padding:
                    "4px 8px",
                  borderRadius:
                    "10px",
                  fontSize:
                    "11px",
                  whiteSpace:
                    "nowrap",
                }}
              >
                {usernameRef.current ||
                  "You"}
              </div>

              <div
                style={{
                  width:
                    "32px",
                  height:
                    "32px",
                  margin:
                    "4px auto 0",
                  borderRadius:
                    "50%",
                  background:
                    "#10b981",
                  border:
                    "3px solid white",
                  boxShadow:
                    "0 0 0 5px rgba(16,185,129,0.2)",
                }}
              />
            </div>

            {/* =================================================
                HEARING RADIUS
            ================================================= */}

            <div
              style={{
                position:
                  "absolute",
                left:
                  `${position.x -
                    HEARING_DISTANCE}px`,
                top:
                  `${position.y -
                    HEARING_DISTANCE}px`,
                width:
                  `${HEARING_DISTANCE *
                    2}px`,
                height:
                  `${HEARING_DISTANCE *
                    2}px`,
                border:
                  "1px dashed rgba(16,185,129,0.45)",
                borderRadius:
                  "50%",
                background:
                  "rgba(16,185,129,0.04)",
                pointerEvents:
                  "none",
                zIndex: 2,
              }}
            />

            {/* =================================================
                NEARBY USER INDICATORS
            ================================================= */}

            {nearbyUsers.map(
              (user) => (
                <div
                  key={
                    `nearby-${user.userId}`
                  }
                  style={{
                    position:
                      "absolute",
                    left:
                      `${user.position?.x || 0}px`,
                    top:
                      `${user.position?.y || 0}px`,
                    transform:
                      "translate(-50%, -50%)",
                    width:
                      "45px",
                    height:
                      "45px",
                    border:
                      "2px solid rgba(16,185,129,0.6)",
                    borderRadius:
                      "50%",
                    pointerEvents:
                      "none",
                    zIndex: 15,
                  }}
                />
              )
            )}

            {/* =================================================
                HINT
            ================================================= */}

            <div
              style={{
                position:
                  "absolute",
                bottom:
                  "12px",
                left:
                  "50%",
                transform:
                  "translateX(-50%)",
                background:
                  "rgba(255,255,255,0.9)",
                padding:
                  "7px 12px",
                borderRadius:
                  "8px",
                fontSize:
                  "12px",
                color:
                  "#475569",
                pointerEvents:
                  "none",
                zIndex: 40,
              }}
            >
              Use W A S D / Arrow Keys to
              move • Click office to move
            </div>
          </div>
        </main>

        {/* ====================================================
            RIGHT SIDEBAR
        ==================================================== */}

        <aside
          style={{
            width:
              "280px",
            minWidth:
              "280px",
            padding:
              "12px",
            overflowY:
              "auto",
            background:
              "#ffffff",
            borderLeft:
              "1px solid #e2e8f0",
          }}
        >
          {/* ==================================================
              ONLINE USERS
          ================================================== */}

          <div
            style={{
              marginBottom:
                "12px",
            }}
          >
            <OnlineUsers
              users={users}
              nearbyUsers={
                nearbyUsers
              }
            />
          </div>

          {/* ==================================================
              VOICE
          ================================================== */}

          <div
            style={{
              marginBottom:
                "12px",
            }}
          >
            <ProximityVoice
              nearbyUsers={
                nearbyUsers
              }
              remoteStreams={
                remoteStreams
              }
            />
          </div>

          {/* ==================================================
              VOICE CONTROLS
          ================================================== */}

          <div
            style={{
              marginBottom:
                "12px",
            }}
          >
            <VoiceControls
              isMuted={
                isMuted
              }
              micEnabled={
                micEnabled
              }
              onToggleMute={
                handleVoiceToggle
              }
              onEnableVoice={
                enableVoice
              }
            />
          </div>

          {/* ==================================================
              MINI MAP
          ================================================== */}

          <div
            style={{
              marginBottom:
                "12px",
            }}
          >
            <MiniMap
              position={
                position
              }
              users={users}
            />
          </div>
        </aside>
      </div>

      {/* ======================================================
          CHAT
      ====================================================== */}

      <div
        style={{
          position:
            "fixed",
          right:
            "300px",
          bottom:
            "20px",
          zIndex: 100,
        }}
      >
        <ChatBox
          messages={
            messages
          }
          onSendMessage={
            sendMessage
          }
        />
      </div>
    </div>
  );
}

export default OfficeCanvas;