// Music player logic (bytebeat)
(function () {
  const tracks = window.BytebeatTracks || [];
  if (!tracks.length) return;

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = AudioCtx ? new AudioCtx() : null;
  if (!audioCtx) return;

  const CHANNELS = 2;
  const DEFAULT_GAIN = 0.12;
  const GAP_SECONDS = 1;
  const DEFAULT_DURATION = 45000;
  const FADE_OUT_MS = 600;

  const gainNode = audioCtx.createGain();
  let scriptNode;
  let sampleIndex = 0;
  let trackIndex = 0;
  let gapSamplesRemaining = 0;
  let targetGain = DEFAULT_GAIN;
  let rotationTimer;

  const playBtn = document.querySelector("[data-play]");
  const stickyPlayer = document.querySelector(".sticky-player");
  const stickyTrack = document.getElementById("sticky-track");

  const currentTrack = () => tracks[trackIndex];

  const syncTrackLabel = () => {
    if (!stickyTrack) return;
    const t = currentTrack();
    stickyTrack.textContent = `${t.title} — ${t.artist}`;
  };

  const syncPlayState = () => {
    const running = audioCtx.state === "running";
    if (playBtn) playBtn.textContent = running ? "Pause" : "Play";
    stickyPlayer?.classList.toggle("paused", !running || gapSamplesRemaining > 0);
  };

  const stopRotation = () => {
    if (rotationTimer) {
      clearTimeout(rotationTimer);
      rotationTimer = null;
    }
  };

  const scheduleRotation = (durationMs) => {
    stopRotation();
    rotationTimer = setTimeout(() => {
      fadeOut(FADE_OUT_MS / 1000);
      setTimeout(() => {
        setTrack(trackIndex + 1);
        fadeIn();
      }, FADE_OUT_MS);
    }, durationMs);
  };

  const setTrack = (index, withGap = true) => {
    trackIndex = (index + tracks.length) % tracks.length;
    sampleIndex = 0;
    const next = currentTrack();
    targetGain = next.gain ?? DEFAULT_GAIN;
    gapSamplesRemaining = withGap ? Math.floor((audioCtx.sampleRate || 44100) * GAP_SECONDS) : 0;
    syncTrackLabel();
    window.dispatchEvent(new CustomEvent("bytebeat-track-change", { detail: { index: trackIndex, track: next } }));
    scheduleRotation(next.durationMs ?? DEFAULT_DURATION);
  };

  gainNode.connect(audioCtx.destination);
  scriptNode = audioCtx.createScriptProcessor(1024, 0, CHANNELS);
  scriptNode.onaudioprocess = (event) => {
    const out0 = event.outputBuffer.getChannelData(0);
    const out1 = event.outputBuffer.numberOfChannels > 1 ? event.outputBuffer.getChannelData(1) : out0;
    const track = currentTrack();
    const rateScale = track.sampleRate / audioCtx.sampleRate;
    for (let i = 0; i < out0.length; i++, sampleIndex++) {
      if (gapSamplesRemaining > 0) {
        out0[i] = 0;
        out1[i] = 0;
        gapSamplesRemaining--;
        continue;
      }
      const t = Math.floor(sampleIndex * rateScale);
      const sample = track.sample(t);
      const l = Array.isArray(sample) ? sample[0] ?? 0 : sample;
      const r = Array.isArray(sample) ? sample[1] ?? sample[0] ?? 0 : sample;
      out0[i] = l;
      out1[i] = r;
    }
  };
  scriptNode.connect(gainNode);

  const resumePlayback = () => {
    stopRotation();
    return audioCtx
      .resume()
      .then(() => {
        fadeIn();
        scheduleRotation(currentTrack().durationMs ?? DEFAULT_DURATION);
        syncPlayState();
        return true;
      })
      .catch(() => false);
  };

  const pausePlayback = () => {
    stopRotation();
    return audioCtx
      .suspend()
      .then(() => {
        syncPlayState();
        return true;
      })
      .catch(() => false);
  };

  const skipTrack = () => {
    stopRotation();
    fadeOut(FADE_OUT_MS / 1000);
    return new Promise((resolve) => {
      setTimeout(() => {
        setTrack(trackIndex + 1);
        fadeIn();
        syncPlayState();
        resolve(true);
      }, FADE_OUT_MS);
    });
  };

  const getState = () => ({
    isRunning: audioCtx.state === "running",
    index: trackIndex,
    track: currentTrack(),
  });

  playBtn?.addEventListener("click", () => {
    if (audioCtx.state === "suspended") {
      resumePlayback();
    } else {
      pausePlayback();
    }
  });

  audioCtx.addEventListener("statechange", syncPlayState);

  document.addEventListener(
    "pointerdown",
    () => {
      audioCtx.resume().catch(() => {});
      syncPlayState();
    },
    { once: true }
  );

  const fadeIn = () => {
    const now = audioCtx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(targetGain, now + 2);
  };

  const fadeOut = (durationSeconds) => {
    const now = audioCtx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(0, now + durationSeconds);
  };

  const startPlayback = () => {
    resumePlayback();
  };

  window.BytebeatPlayer = {
    play: resumePlayback,
    pause: pausePlayback,
    next: skipTrack,
    toggle: () => (audioCtx.state === "suspended" ? resumePlayback() : pausePlayback()),
    state: getState,
    label: () => `${currentTrack().title} — ${currentTrack().artist}`,
  };

  setTrack(0, false);
  syncTrackLabel();
  syncPlayState();
  startPlayback();
})();
