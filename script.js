const introScreen = document.getElementById("introScreen");
const siteShell = document.getElementById("siteShell");
const bioCard = document.getElementById("bioCard");
const typedName = document.getElementById("typedName");
const audioPlayer = document.getElementById("audioPlayer");
const playToggle = document.getElementById("playToggle");
const playIcon = document.getElementById("playIcon");
const muteToggle = document.getElementById("muteToggle");
const volumeIcon = document.getElementById("volumeIcon");
const timeline = document.getElementById("timeline");
const volumeSlider = document.getElementById("volumeSlider");
const currentTimeLabel = document.getElementById("currentTime");
const durationLabel = document.getElementById("duration");
const audioStatus = document.getElementById("audioStatus");
const visualizerBars = Array.from(document.querySelectorAll(".bar"));
const particlesHost = document.getElementById("particles");

const fullName = "ay3ent";
let introDone = false;
let typingStarted = false;
let typingTimer = null;
let audioContext;
let analyser;
let sourceNode;
let dataArray;
let animationFrameId;
let lastVolume = Number(volumeSlider.value);

function createParticles() {
  const particleCount = 24;

  for (let index = 0; index < particleCount; index += 1) {
    const particle = document.createElement("span");
    const size = (Math.random() * 7 + 4).toFixed(2);
    const left = `${Math.random() * 100}%`;
    const top = `${Math.random() * 100}%`;
    const duration = `${10 + Math.random() * 12}s`;
    const delay = `${Math.random() * -12}s`;

    particle.className = "particle";
    particle.style.setProperty("--size", `${size}px`);
    particle.style.setProperty("--left", left);
    particle.style.setProperty("--top", top);
    particle.style.setProperty("--duration", duration);
    particle.style.setProperty("--delay", delay);
    particlesHost.appendChild(particle);
  }
}

function typeName() {
  if (typingStarted) {
    return;
  }

  typingStarted = true;
  typedName.textContent = "";

  let charIndex = 0;
  typingTimer = window.setInterval(() => {
    typedName.textContent = fullName.slice(0, charIndex + 1);
    charIndex += 1;

    if (charIndex >= fullName.length) {
      window.clearInterval(typingTimer);
    }
  }, 220);
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${remainder}`;
}

function updateTimeline() {
  if (!Number.isFinite(audioPlayer.duration) || audioPlayer.duration === 0) {
    timeline.value = 0;
    document.documentElement.style.setProperty("--player-progress", "0%");
    currentTimeLabel.textContent = "0:00";
    durationLabel.textContent = "0:00";
    return;
  }

  const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
  timeline.value = progress;
  document.documentElement.style.setProperty("--player-progress", `${progress}%`);
  currentTimeLabel.textContent = formatTime(audioPlayer.currentTime);
  durationLabel.textContent = formatTime(audioPlayer.duration);
}

function updateVolumeVisual(value) {
  document.documentElement.style.setProperty("--volume-progress", `${value * 100}%`);
}

function setPlayingState(isPlaying) {
  playIcon.textContent = isPlaying ? "❚❚" : "▶";
  document.body.classList.toggle("music-active", isPlaying);
}

function updateVolumeIcon() {
  if (audioPlayer.muted || audioPlayer.volume === 0) {
    volumeIcon.textContent = "◌";
    return;
  }

  volumeIcon.textContent = audioPlayer.volume < 0.45 ? "◔" : "◉";
}

function ensureAudioGraph() {
  if (audioContext) {
    return;
  }

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    return;
  }

  audioContext = new AudioCtx();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 128;
  analyser.smoothingTimeConstant = 0.82;
  dataArray = new Uint8Array(analyser.frequencyBinCount);

  sourceNode = audioContext.createMediaElementSource(audioPlayer);
  sourceNode.connect(analyser);
  analyser.connect(audioContext.destination);
}

async function playAudio() {
  try {
    ensureAudioGraph();

    if (audioContext?.state === "suspended") {
      await audioContext.resume();
    }

    await audioPlayer.play();
    setPlayingState(true);

    if (!animationFrameId) {
      animateAudio();
    }
  } catch (error) {
    audioStatus.textContent = "tap play to start";
    setPlayingState(false);
  }
}

function pauseAudio() {
  audioPlayer.pause();
  setPlayingState(false);
}

function animateAudio() {
  if (!analyser || !dataArray) {
    animationFrameId = requestAnimationFrame(animateAudio);
    return;
  }

  analyser.getByteFrequencyData(dataArray);

  let lowSum = 0;
  let midSum = 0;
  let total = 0;

  for (let index = 0; index < dataArray.length; index += 1) {
    const value = dataArray[index];
    total += value;

    if (index < dataArray.length * 0.18) {
      lowSum += value;
    } else if (index < dataArray.length * 0.55) {
      midSum += value;
    }
  }

  const average = total / dataArray.length / 255;
  const bass = lowSum / Math.max(1, Math.floor(dataArray.length * 0.18)) / 255;
  const mids = midSum / Math.max(1, Math.floor(dataArray.length * 0.37)) / 255;

  document.documentElement.style.setProperty("--bg-scale", `${1 + bass * 0.08}`);
  document.documentElement.style.setProperty("--bg-brightness", `${0.88 + average * 0.28}`);
  document.documentElement.style.setProperty("--bg-saturation", `${1.05 + mids * 0.8}`);
  document.documentElement.style.setProperty("--card-shift", `${(bass - 0.15) * 22}px`);
  document.documentElement.style.setProperty("--card-glow", `${0.45 + average * 0.95}`);
  document.documentElement.style.setProperty("--neon-intensity", `${0.32 + average * 0.9}`);

  visualizerBars.forEach((bar, index) => {
    const sample = dataArray[index * 2] ?? dataArray[index] ?? 0;
    const barScale = 0.22 + sample / 255;
    bar.style.transform = `scaleY(${barScale})`;
    bar.style.opacity = `${0.55 + sample / 255}`;
  });

  animationFrameId = requestAnimationFrame(animateAudio);
}

function revealSite() {
  if (introDone) {
    return;
  }

  introDone = true;
  document.body.classList.add("entered");
  introScreen.classList.add("hidden");
  siteShell.classList.add("visible");

  window.setTimeout(() => {
    bioCard.classList.add("revealed");
    typeName();
  }, 130);

  playAudio();
}

function onIntroAction(event) {
  if (event.type === "keydown" && event.key === "Tab") {
    return;
  }

  revealSite();
}

function togglePlayback() {
  if (audioPlayer.paused) {
    playAudio();
  } else {
    pauseAudio();
  }
}

function toggleMute() {
  if (audioPlayer.muted || audioPlayer.volume === 0) {
    audioPlayer.muted = false;
    audioPlayer.volume = lastVolume > 0 ? lastVolume : 0.65;
    volumeSlider.value = String(audioPlayer.volume);
  } else {
    lastVolume = audioPlayer.volume;
    audioPlayer.muted = true;
    volumeSlider.value = "0";
  }

  updateVolumeVisual(Number(volumeSlider.value));
  updateVolumeIcon();
}

introScreen.addEventListener("click", onIntroAction);
introScreen.addEventListener("keydown", onIntroAction);
window.addEventListener("keydown", onIntroAction, { once: true });
window.addEventListener("pointerdown", onIntroAction, { once: true });

playToggle.addEventListener("click", togglePlayback);
muteToggle.addEventListener("click", toggleMute);

timeline.addEventListener("input", () => {
  if (!Number.isFinite(audioPlayer.duration) || audioPlayer.duration === 0) {
    return;
  }

  const nextTime = (Number(timeline.value) / 100) * audioPlayer.duration;
  audioPlayer.currentTime = nextTime;
  updateTimeline();
});

volumeSlider.addEventListener("input", () => {
  const value = Number(volumeSlider.value);
  audioPlayer.muted = false;
  audioPlayer.volume = value;

  if (value > 0) {
    lastVolume = value;
  }

  updateVolumeVisual(value);
  updateVolumeIcon();
});

audioPlayer.addEventListener("timeupdate", updateTimeline);
audioPlayer.addEventListener("loadedmetadata", updateTimeline);
audioPlayer.addEventListener("ended", () => {
  setPlayingState(false);
  audioStatus.textContent = "music ended";
});
audioPlayer.addEventListener("play", () => {
  setPlayingState(true);
  audioStatus.textContent = "music synced";
});
audioPlayer.addEventListener("pause", () => {
  setPlayingState(false);
  audioStatus.textContent = introDone ? "music paused" : "waiting for intro";
});
audioPlayer.addEventListener("error", () => {
  audioStatus.textContent = "mus.mp3 not found";
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden || !audioContext) {
    return;
  }

  if (audioPlayer.paused) {
    document.body.classList.remove("music-active");
  }
});

createParticles();
updateTimeline();
audioPlayer.volume = Number(volumeSlider.value);
updateVolumeVisual(Number(volumeSlider.value));
updateVolumeIcon();
