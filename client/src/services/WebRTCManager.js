class WebRTCManager {
  constructor(
    socket,
    userId,
    onRemoteStream,
    onPeerLeft
  ) {
    this.socket = socket;
    this.userId = userId;
    this.onRemoteStream =
      onRemoteStream;
    this.onPeerLeft =
      onPeerLeft;

    // remoteUserId -> peer information
    this.peers = new Map();

    this.rtcConfig = {
      iceServers: [
        {
          urls:
            "stun:stun.l.google.com:19302",
        },
      ],
    };

    this.localStream = null;

    this.setupSocketListeners();
  }

  // ============================================================
  // LOCAL AUDIO STREAM
  // ============================================================

  setLocalStream(stream) {
    this.localStream = stream;

    // If peers already exist, add new tracks.
    for (const peer of this.peers.values()) {
      const senders =
        peer.connection.getSenders();

      for (const track of stream.getTracks()) {
        const alreadyAdded =
          senders.some(
            (sender) =>
              sender.track?.id === track.id
          );

        if (!alreadyAdded) {
          peer.connection.addTrack(
            track,
            stream
          );
        }
      }
    }
  }

  // ============================================================
  // SOCKET LISTENERS
  // ============================================================

  setupSocketListeners() {
    this.socket.on(
      "webrtc:offer",
      async ({
        from,
        fromUserId,
        offer,
      }) => {
        try {
          if (!from || !fromUserId || !offer) {
            return;
          }

          await this.handleOffer(
            fromUserId,
            from,
            offer
          );
        } catch (error) {
          console.error(
            "WebRTC offer handling error:",
            error
          );
        }
      }
    );

    this.socket.on(
      "webrtc:answer",
      async ({
        from,
        fromUserId,
        answer,
      }) => {
        try {
          if (
            !from ||
            !fromUserId ||
            !answer
          ) {
            return;
          }

          const peer =
            this.peers.get(
              fromUserId
            );

          if (!peer) {
            return;
          }

          await peer.connection.setRemoteDescription(
            new RTCSessionDescription(
              answer
            )
          );
        } catch (error) {
          console.error(
            "WebRTC answer error:",
            error
          );
        }
      }
    );

    this.socket.on(
      "webrtc:ice-candidate",
      async ({
        fromUserId,
        candidate,
      }) => {
        try {
          if (
            !fromUserId ||
            !candidate
          ) {
            return;
          }

          const peer =
            this.peers.get(
              fromUserId
            );

          if (!peer) {
            return;
          }

          await peer.connection.addIceCandidate(
            new RTCIceCandidate(
              candidate
            )
          );
        } catch (error) {
          console.error(
            "ICE candidate error:",
            error
          );
        }
      }
    );

    this.socket.on(
      "webrtc:peer-left",
      ({ userId }) => {
        if (!userId) return;

        this.removePeer(userId);
      }
    );
  }

  // ============================================================
  // CREATE PEER CONNECTION
  // ============================================================

  createPeerConnection(
    remoteUserId,
    remoteSocketId
  ) {
    const existing =
      this.peers.get(
        remoteUserId
      );

    if (existing) {
      return existing.connection;
    }

    const connection =
      new RTCPeerConnection(
        this.rtcConfig
      );

    // Add microphone tracks.
    if (this.localStream) {
      this.localStream
        .getTracks()
        .forEach((track) => {
          connection.addTrack(
            track,
            this.localStream
          );
        });
    }

    // ICE candidate.
    connection.onicecandidate = (
      event
    ) => {
      if (!event.candidate) {
        return;
      }

      if (!remoteSocketId) {
        console.warn(
          "Missing remote socket ID for ICE"
        );

        return;
      }

      this.socket.emit(
        "webrtc:ice-candidate",
        {
          to: remoteSocketId,
          candidate:
            event.candidate,
        }
      );
    };

    // Remote audio.
    connection.ontrack = (
      event
    ) => {
      const stream =
        event.streams?.[0];

      if (!stream) {
        return;
      }

      console.log(
        "Remote audio stream received:",
        remoteUserId
      );

      this.onRemoteStream(
        remoteUserId,
        stream
      );
    };

    // Connection state.
    connection.onconnectionstatechange =
      () => {
        const state =
          connection.connectionState;

        console.log(
          `WebRTC ${remoteUserId}: ${state}`
        );

        if (
          state === "failed" ||
          state === "closed"
        ) {
          this.removePeer(
            remoteUserId
          );
        }
      };

    this.peers.set(
      remoteUserId,
      {
        connection,
        socketId:
          remoteSocketId,
      }
    );

    return connection;
  }

  // ============================================================
  // CREATE OFFER
  // ============================================================

  async createOffer(
    remoteUserId,
    remoteSocketId
  ) {
    try {
      if (
        !remoteUserId ||
        !remoteSocketId
      ) {
        return;
      }

      // Don't create duplicate peer.
      if (
        this.peers.has(
          remoteUserId
        )
      ) {
        return;
      }

      const connection =
        this.createPeerConnection(
          remoteUserId,
          remoteSocketId
        );

      const offer =
        await connection.createOffer();

      await connection.setLocalDescription(
        offer
      );

      this.socket.emit(
        "webrtc:offer",
        {
          to: remoteSocketId,
          offer,
        }
      );

      console.log(
        `Created offer for ${remoteUserId}`
      );
    } catch (error) {
      console.error(
        "createOffer error:",
        error
      );

      this.removePeer(
        remoteUserId
      );
    }
  }

  // ============================================================
  // HANDLE OFFER
  // ============================================================

  async handleOffer(
    remoteUserId,
    remoteSocketId,
    offer
  ) {
    try {
      const connection =
        this.createPeerConnection(
          remoteUserId,
          remoteSocketId
        );

      await connection.setRemoteDescription(
        new RTCSessionDescription(
          offer
        )
      );

      const answer =
        await connection.createAnswer();

      await connection.setLocalDescription(
        answer
      );

      this.socket.emit(
        "webrtc:answer",
        {
          to: remoteSocketId,
          answer,
        }
      );

      console.log(
        `Created answer for ${remoteUserId}`
      );
    } catch (error) {
      console.error(
        "handleOffer error:",
        error
      );

      this.removePeer(
        remoteUserId
      );
    }
  }

  // ============================================================
  // REMOVE PEER
  // ============================================================

  removePeer(remoteUserId) {
    const peer =
      this.peers.get(
        remoteUserId
      );

    if (!peer) {
      return;
    }

    try {
      peer.connection.ontrack =
        null;

      peer.connection.onicecandidate =
        null;

      peer.connection.onconnectionstatechange =
        null;

      peer.connection.close();
    } catch (error) {
      console.error(
        "Peer close error:",
        error
      );
    }

    this.peers.delete(
      remoteUserId
    );

    if (this.onPeerLeft) {
      this.onPeerLeft(
        remoteUserId
      );
    }
  }

  // ============================================================
  // CLOSE EVERYTHING
  // ============================================================

  close() {
    for (const [
      remoteUserId,
      peer,
    ] of this.peers.entries()) {
      try {
        peer.connection.close();
      } catch (error) {
        console.error(
          "Connection close error:",
          error
        );
      }

      if (this.onPeerLeft) {
        this.onPeerLeft(
          remoteUserId
        );
      }
    }

    this.peers.clear();

    // Remove socket listeners.
    this.socket.off(
      "webrtc:offer"
    );

    this.socket.off(
      "webrtc:answer"
    );

    this.socket.off(
      "webrtc:ice-candidate"
    );

    this.socket.off(
      "webrtc:peer-left"
    );
  }
}

export default WebRTCManager;