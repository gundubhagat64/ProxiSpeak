
import { useEffect, useRef, useState } from "react";
import socket from "../socket";

const HEARING_DISTANCE = 100;

const ICE_SERVERS = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

function ProximityVoice({
  userId,
  localPosition,
  nearbyUsers = [],
}) {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState("Voice disabled");

  const localStreamRef = useRef(null);
  const peersRef = useRef(new Map());

  // -----------------------------------------
  // DISTANCE
  // -----------------------------------------

  const getDistance = (remoteUser) => {
    if (!localPosition || !remoteUser?.position) {
      return Infinity;
    }

    const dx =
      remoteUser.position.x - localPosition.x;

    const dy =
      remoteUser.position.y - localPosition.y;

    return Math.sqrt(dx * dx + dy * dy);
  };

  // -----------------------------------------
  // VOLUME
  // -----------------------------------------

  const getVolume = (distance) => {
    if (distance >= HEARING_DISTANCE) {
      return 0;
    }

    const volume =
      1 - distance / HEARING_DISTANCE;

    return Math.max(0, Math.min(1, volume));
  };

  // -----------------------------------------
  // UPDATE SPATIAL AUDIO
  // -----------------------------------------

  const updateSpatialAudio = (
    remoteUserId,
    remoteUser
  ) => {
    const peer = peersRef.current.get(remoteUserId);

    if (!peer) {
      return;
    }

    if (!localPosition || !remoteUser?.position) {
      return;
    }

    const localX = localPosition.x || 0;
    const localY = localPosition.y || 0;

    const remoteX = remoteUser.position.x || 0;
    const remoteY = remoteUser.position.y || 0;

    const dx = remoteX - localX;
    const dy = remoteY - localY;

    const distance =
      Math.sqrt(dx * dx + dy * dy);

    // Volume based on distance
    const volume = getVolume(distance);

    if (peer.gainNode) {
      peer.gainNode.gain.value =
        muted ? 0 : volume;
    }

    // -----------------------------------------
    // 3D POSITION
    // -----------------------------------------

    if (peer.pannerNode) {
      const x =
        Math.max(
          -1,
          Math.min(
            1,
            dx / HEARING_DISTANCE
          )
        ) * 10;

      const y =
        Math.max(
          -1,
          Math.min(
            1,
            dy / HEARING_DISTANCE
          )
        ) * 10;

      const z = 0;

      if (
        "positionX" in peer.pannerNode
      ) {
        peer.pannerNode.positionX.value = x;
        peer.pannerNode.positionY.value = y;
        peer.pannerNode.positionZ.value = z;
      } else {
        peer.pannerNode.setPosition(
          x,
          y,
          z
        );
      }
    }
  };

  // -----------------------------------------
  // CLOSE PEER
  // -----------------------------------------

  const closePeer = (
    remoteUserId,
    notifyServer = true
  ) => {
    const peer =
      peersRef.current.get(remoteUserId);

    if (!peer) {
      return;
    }

    try {
      peer.pc.close();
    } catch (error) {
      console.warn(error);
    }

    try {
      if (peer.audioContext) {
        peer.audioContext.close();
      }
    } catch (error) {
      console.warn(error);
    }

    if (peer.audioElement) {
      peer.audioElement.srcObject = null;
    }

    peersRef.current.delete(remoteUserId);

    if (notifyServer) {
      socket.emit(
        "webrtc:peer-left",
        {
          targetUserId: remoteUserId,
        }
      );
    }
  };

  // -----------------------------------------
  // CREATE PEER CONNECTION
  // -----------------------------------------

  const createPeerConnection = async (
    remoteUserId,
    remoteUser,
    createOffer
  ) => {
    if (!localStreamRef.current) {
      return null;
    }

    // Don't create duplicate connection
    if (
      peersRef.current.has(remoteUserId)
    ) {
      return peersRef.current.get(
        remoteUserId
      ).pc;
    }

    console.log(
      "Creating WebRTC connection:",
      remoteUserId
    );

    const pc =
      new RTCPeerConnection(
        ICE_SERVERS
      );

    // -----------------------------------------
    // LOCAL AUDIO TRACK
    // -----------------------------------------

    localStreamRef.current
      .getTracks()
      .forEach((track) => {
        pc.addTrack(
          track,
          localStreamRef.current
        );
      });

    // -----------------------------------------
    // AUDIO CONTEXT
    // -----------------------------------------

    const audioContext =
      new AudioContext();

    const gainNode =
      audioContext.createGain();

    const pannerNode =
      audioContext.createPanner();

    pannerNode.panningModel = "HRTF";
    pannerNode.distanceModel = "inverse";

    pannerNode.refDistance = 1;
    pannerNode.maxDistance =
      HEARING_DISTANCE;

    pannerNode.rolloffFactor = 1;

    pannerNode.coneInnerAngle = 360;
    pannerNode.coneOuterAngle = 360;
    pannerNode.coneOuterGain = 0;

    gainNode.gain.value = 0;

    pannerNode.connect(gainNode);
    gainNode.connect(
      audioContext.destination
    );

    // -----------------------------------------
    // AUDIO ELEMENT
    // -----------------------------------------

    const audioElement =
      document.createElement("audio");

    audioElement.autoplay = true;
    audioElement.playsInline = true;

    // -----------------------------------------
    // STORE PEER
    // -----------------------------------------

    peersRef.current.set(
      remoteUserId,
      {
        pc,
        remoteUser,
        audioContext,
        gainNode,
        pannerNode,
        audioElement,
        source: null,
      }
    );

    // -----------------------------------------
    // REMOTE AUDIO
    // -----------------------------------------

    pc.ontrack = async (event) => {
      console.log(
        "Remote audio received:",
        remoteUserId
      );

      const remoteStream =
        event.streams[0];

      if (!remoteStream) {
        return;
      }

      audioElement.srcObject =
        remoteStream;

      try {
        await audioElement.play();
      } catch (error) {
        console.warn(
          "Audio play blocked:",
          error
        );
      }

      try {
        const source =
          audioContext.createMediaStreamSource(
            remoteStream
          );

        source.connect(
          pannerNode
        );

        const peer =
          peersRef.current.get(
            remoteUserId
          );

        if (peer) {
          peer.source = source;
        }

        updateSpatialAudio(
          remoteUserId,
          remoteUser
        );
      } catch (error) {
        console.error(
          "Audio processing error:",
          error
        );
      }
    };

    // -----------------------------------------
    // ICE
    // -----------------------------------------

    pc.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }

      socket.emit(
        "webrtc:ice-candidate",
        {
          targetUserId:
            remoteUserId,

          candidate:
            event.candidate,
        }
      );
    };

    // -----------------------------------------
    // CONNECTION STATE
    // -----------------------------------------

    pc.onconnectionstatechange = () => {
      console.log(
        "WebRTC connection:",
        remoteUserId,
        pc.connectionState
      );

      if (
        pc.connectionState === "failed" ||
        pc.connectionState === "closed" ||
        pc.connectionState === "disconnected"
      ) {
        closePeer(
          remoteUserId,
          false
        );
      }
    };

    // -----------------------------------------
    // OFFER
    // -----------------------------------------

    if (createOffer) {
      try {
        const offer =
          await pc.createOffer();

        await pc.setLocalDescription(
          offer
        );

        socket.emit(
          "webrtc:offer",
          {
            targetUserId:
              remoteUserId,

            offer:
              pc.localDescription,
          }
        );

        console.log(
          "Offer sent:",
          remoteUserId
        );
      } catch (error) {
        console.error(
          "Offer error:",
          error
        );
      }
    }

    return pc;
  };

  // -----------------------------------------
  // START VOICE
  // -----------------------------------------

  const startVoice = async () => {
    try {
      setStatus(
        "Requesting microphone..."
      );

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setStatus(
          "Microphone API not supported"
        );
        return;
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

      setVoiceEnabled(true);
      setMuted(false);
      setStatus(
        "Spatial voice enabled"
      );

      console.log(
        "Microphone enabled"
      );
    } catch (error) {
      console.error(
        "Microphone error:",
        error
      );

      setStatus(
        "Microphone permission denied"
      );
    }
  };

  // -----------------------------------------
  // STOP VOICE
  // -----------------------------------------

  const stopVoice = () => {
    peersRef.current.forEach(
      (_, remoteUserId) => {
        closePeer(
          remoteUserId,
          true
        );
      }
    );

    if (localStreamRef.current) {
      localStreamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      localStreamRef.current = null;
    }

    setVoiceEnabled(false);
    setMuted(false);
    setStatus(
      "Voice disabled"
    );
  };

  // -----------------------------------------
  // MUTE
  // -----------------------------------------

  const toggleMute = () => {
    if (!localStreamRef.current) {
      return;
    }

    const newMuted = !muted;

    localStreamRef.current
      .getAudioTracks()
      .forEach((track) => {
        track.enabled = !newMuted;
      });

    setMuted(newMuted);

    peersRef.current.forEach(
      (peer) => {
        if (peer.gainNode) {
          if (newMuted) {
            peer.gainNode.gain.value = 0;
          }
        }
      }
    );
  };

  // -----------------------------------------
  // RECEIVE OFFER
  // -----------------------------------------

  useEffect(() => {
    const handleOffer = async (data) => {
      const fromUserId =
        data.fromUserId;

      const offer = data.offer;

      console.log(
        "Received offer:",
        fromUserId
      );

      if (!voiceEnabled) {
        return;
      }

      const remoteUser =
        nearbyUsers.find(
          (user) =>
            String(user.userId) ===
            String(fromUserId)
        );

      if (!remoteUser) {
        return;
      }

      try {
        const pc =
          await createPeerConnection(
            fromUserId,
            remoteUser,
            false
          );

        if (!pc) {
          return;
        }

        await pc.setRemoteDescription(
          new RTCSessionDescription(
            offer
          )
        );

        const answer =
          await pc.createAnswer();

        await pc.setLocalDescription(
          answer
        );

        socket.emit(
          "webrtc:answer",
          {
            targetUserId:
              fromUserId,

            answer:
              pc.localDescription,
          }
        );

        console.log(
          "Answer sent:",
          fromUserId
        );
      } catch (error) {
        console.error(
          "Offer handling error:",
          error
        );

        closePeer(
          fromUserId,
          false
        );
      }
    };

    socket.on(
      "webrtc:offer",
      handleOffer
    );

    return () => {
      socket.off(
        "webrtc:offer",
        handleOffer
      );
    };
  }, [
    voiceEnabled,
    nearbyUsers,
  ]);

  // -----------------------------------------
  // RECEIVE ANSWER
  // -----------------------------------------

  useEffect(() => {
    const handleAnswer = async (data) => {
      const fromUserId =
        data.fromUserId;

      const answer = data.answer;

      console.log(
        "Received answer:",
        fromUserId
      );

      const peer =
        peersRef.current.get(
          fromUserId
        );

      if (!peer) {
        return;
      }

      try {
        await peer.pc.setRemoteDescription(
          new RTCSessionDescription(
            answer
          )
        );

        console.log(
          "Answer accepted:",
          fromUserId
        );
      } catch (error) {
        console.error(
          "Answer error:",
          error
        );
      }
    };

    socket.on(
      "webrtc:answer",
      handleAnswer
    );

    return () => {
      socket.off(
        "webrtc:answer",
        handleAnswer
      );
    };
  }, []);

  // -----------------------------------------
  // RECEIVE ICE
  // -----------------------------------------

  useEffect(() => {
    const handleIce = async (data) => {
      const fromUserId =
        data.fromUserId;

      const candidate =
        data.candidate;

      const peer =
        peersRef.current.get(
          fromUserId
        );

      if (!peer) {
        return;
      }

      try {
        await peer.pc.addIceCandidate(
          new RTCIceCandidate(
            candidate
          )
        );
      } catch (error) {
        console.error(
          "ICE error:",
          error
        );
      }
    };

    socket.on(
      "webrtc:ice-candidate",
      handleIce
    );

    return () => {
      socket.off(
        "webrtc:ice-candidate",
        handleIce
      );
    };
  }, []);

  // -----------------------------------------
  // PEER LEFT
  // -----------------------------------------

  useEffect(() => {
    const handlePeerLeft = (data) => {
      const remoteUserId =
        data.userId;

      console.log(
        "Peer left:",
        remoteUserId
      );

      closePeer(
        remoteUserId,
        false
      );
    };

    socket.on(
      "webrtc:peer-left",
      handlePeerLeft
    );

    return () => {
      socket.off(
        "webrtc:peer-left",
        handlePeerLeft
      );
    };
  }, []);

  // -----------------------------------------
  // CREATE NEARBY CONNECTIONS
  // -----------------------------------------

  useEffect(() => {
    if (!voiceEnabled) {
      return;
    }

    if (!userId) {
      return;
    }

    if (!localStreamRef.current) {
      return;
    }

    nearbyUsers.forEach(
      async (remoteUser) => {
        if (!remoteUser?.userId) {
          return;
        }

        const remoteUserId =
          remoteUser.userId;

        if (
          String(remoteUserId) ===
          String(userId)
        ) {
          return;
        }

        const distance =
          getDistance(remoteUser);

        // Outside 100px
        if (
          distance >
          HEARING_DISTANCE
        ) {
          if (
            peersRef.current.has(
              remoteUserId
            )
          ) {
            closePeer(
              remoteUserId,
              true
            );
          }

          return;
        }

        // Existing peer
        if (
          peersRef.current.has(
            remoteUserId
          )
        ) {
          const peer =
            peersRef.current.get(
              remoteUserId
            );

          peer.remoteUser =
            remoteUser;

          updateSpatialAudio(
            remoteUserId,
            remoteUser
          );

          return;
        }

        /*
         * Only one user creates
         * the WebRTC offer.
         */

        const createOffer =
          String(userId) <
          String(remoteUserId);

        await createPeerConnection(
          remoteUserId,
          remoteUser,
          createOffer
        );
      }
    );
  }, [
    voiceEnabled,
    userId,
    nearbyUsers,
  ]);

  // -----------------------------------------
  // UPDATE AUDIO WHEN POSITION CHANGES
  // -----------------------------------------

  useEffect(() => {
    if (!voiceEnabled) {
      return;
    }

    peersRef.current.forEach(
      (peer, remoteUserId) => {
        const remoteUser =
          nearbyUsers.find(
            (user) =>
              String(user.userId) ===
              String(remoteUserId)
          );

        if (!remoteUser) {
          return;
        }

        peer.remoteUser =
          remoteUser;

        const distance =
          getDistance(remoteUser);

        if (
          distance >
          HEARING_DISTANCE
        ) {
          closePeer(
            remoteUserId,
            true
          );

          return;
        }

        updateSpatialAudio(
          remoteUserId,
          remoteUser
        );
      }
    );
  }, [
    localPosition,
    nearbyUsers,
    muted,
    voiceEnabled,
  ]);

  // -----------------------------------------
  // CLEANUP
  // -----------------------------------------

  useEffect(() => {
    return () => {
      peersRef.current.forEach(
        (_, remoteUserId) => {
          closePeer(
            remoteUserId,
            false
          );
        }
      );

      if (localStreamRef.current) {
        localStreamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });

        localStreamRef.current = null;
      }
    };
  }, []);

  // -----------------------------------------
  // UI
  // -----------------------------------------

  return (
    <div
      style={{
        position: "absolute",
        bottom: "20px",
        right: "20px",
        width: "260px",
        padding: "16px",
        background: "rgba(15, 23, 42, 0.95)",
        border: "1px solid rgba(148, 163, 184, 0.25)",
        borderRadius: "14px",
        color: "white",
        zIndex: 1000,
        boxShadow:
          "0 10px 30px rgba(0, 0, 0, 0.35)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}
      >
        <div>
          <div
            style={{
              fontWeight: "700",
              fontSize: "15px",
            }}
          >
            Spatial Voice
          </div>

          <div
            style={{
              fontSize: "11px",
              color: "#94a3b8",
              marginTop: "3px",
            }}
          >
            WebRTC + 3D Audio
          </div>
        </div>

        <div
          style={{
            width: "9px",
            height: "9px",
            borderRadius: "50%",
            background: voiceEnabled
              ? "#22c55e"
              : "#64748b",
          }}
        />
      </div>

      <div
        style={{
          fontSize: "12px",
          color: "#cbd5e1",
          marginBottom: "12px",
        }}
      >
        {status}
      </div>

      <div
        style={{
          fontSize: "12px",
          marginBottom: "12px",
        }}
      >
        Nearby users:{" "}
        <strong>
          {nearbyUsers.length}
        </strong>
      </div>

      {!voiceEnabled ? (
        <button
          onClick={startVoice}
          style={{
            width: "100%",
            padding: "10px",
            border: "none",
            borderRadius: "8px",
            background: "#2563eb",
            color: "white",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Start Spatial Voice
        </button>
      ) : (
        <div
          style={{
            display: "flex",
            gap: "8px",
          }}
        >
          <button
            onClick={toggleMute}
            style={{
              flex: 1,
              padding: "9px",
              border: "none",
              borderRadius: "8px",
              background: muted
                ? "#dc2626"
                : "#334155",
              color: "white",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            {muted ? "Unmute" : "Mute"}
          </button>

          <button
            onClick={stopVoice}
            style={{
              flex: 1,
              padding: "9px",
              border: "none",
              borderRadius: "8px",
              background: "#7f1d1d",
              color: "white",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Stop
          </button>
        </div>
      )}

      <div
        style={{
          marginTop: "12px",
          paddingTop: "10px",
          borderTop:
            "1px solid rgba(148, 163, 184, 0.15)",
          fontSize: "10px",
          lineHeight: "1.5",
          color: "#94a3b8",
        }}
      >
        Voice automatically becomes
        quieter as users move apart.
      </div>
    </div>
  );
}

export default ProximityVoice;

