class SpatialAudio {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.sources = new Map();

    this.maxDistance = 100;
  }

  initialize() {
    if (this.audioContext) {
      return;
    }

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContext) {
      console.warn(
        "Web Audio API is not supported."
      );

      return;
    }

    this.audioContext =
      new AudioContext();

    this.masterGain =
      this.audioContext.createGain();

    this.masterGain.gain.value = 1;

    this.masterGain.connect(
      this.audioContext.destination
    );
  }

  async resume() {
    if (!this.audioContext) {
      this.initialize();
    }

    if (
      this.audioContext &&
      this.audioContext.state ===
        "suspended"
    ) {
      await this.audioContext.resume();
    }
  }

  createRemoteAudio(
    userId,
    stream
  ) {
    if (!stream) {
      return;
    }

    this.initialize();

    if (!this.audioContext) {
      return;
    }

    // Remove old audio if it exists.
    this.removeRemoteAudio(userId);

    const audio =
      document.createElement(
        "audio"
      );

    audio.autoplay = true;
    audio.playsInline = true;

    audio.srcObject = stream;

    const source =
      this.audioContext.createMediaStreamSource(
        stream
      );

    const gainNode =
      this.audioContext.createGain();

    const panner =
      this.audioContext.createStereoPanner();

    gainNode.gain.value = 0;

    panner.pan.value = 0;

    source.connect(gainNode);

    gainNode.connect(panner);

    panner.connect(
      this.masterGain
    );

    this.sources.set(
      userId,
      {
        audio,
        source,
        gainNode,
        panner,
        stream,
      }
    );

    audio
      .play()
      .catch((error) => {
        console.warn(
          "Remote audio autoplay blocked:",
          error
        );
      });
  }

  updateRemoteAudio(
    userId,
    localPosition,
    remotePosition,
    obstacleGain = 1
  ) {
    const source =
      this.sources.get(
        userId
      );

    if (!source) {
      return;
    }

    if (
      !localPosition ||
      !remotePosition
    ) {
      return;
    }

    const dx =
      remotePosition.x -
      localPosition.x;

    const dy =
      remotePosition.y -
      localPosition.y;

    const distance =
      Math.sqrt(
        dx * dx +
          dy * dy
      );

    const clampedDistance =
      Math.min(
        distance,
        this.maxDistance
      );

    // 1 at distance 0.
    // 0 at maxDistance.
    const distanceGain =
      1 -
      clampedDistance /
        this.maxDistance;

    const finalGain =
      Math.max(
        0,
        Math.min(
          1,
          distanceGain *
            obstacleGain
        )
      );

    // Left/right panning.
    let pan = 0;

    if (this.maxDistance > 0) {
      pan =
        dx /
        this.maxDistance;
    }

    pan = Math.max(
      -1,
      Math.min(1, pan)
    );

    source.gainNode.gain.value =
      finalGain;

    source.panner.pan.value =
      pan;
  }

  removeRemoteAudio(
    userId
  ) {
    const source =
      this.sources.get(
        userId
      );

    if (!source) {
      return;
    }

    try {
      source.audio.pause();

      source.audio.srcObject =
        null;

      source.source.disconnect();

      source.gainNode.disconnect();

      source.panner.disconnect();
    } catch (error) {
      console.error(
        "Audio cleanup error:",
        error
      );
    }

    this.sources.delete(
      userId
    );
  }

  removeAll() {
    for (const userId of this.sources.keys()) {
      this.removeRemoteAudio(
        userId
      );
    }
  }

  destroy() {
    this.removeAll();

    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch (error) {
        console.error(
          "Master gain cleanup error:",
          error
        );
      }
    }

    if (this.audioContext) {
      this.audioContext
        .close()
        .catch(() => {});
    }

    this.audioContext = null;
    this.masterGain = null;
  }
}

export default SpatialAudio;