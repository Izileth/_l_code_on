const playButton = document.getElementById("playButton");
const audioFile = document.getElementById("audioFile");
const timeLabel = document.getElementById("timeLabel");
const audio = AudioController.getElement();
let animationFrame = null;
let isLoading = false;

document.documentElement.style.setProperty("--accent", VIDEO_CONFIG.accent);
document.getElementById("trackLabel").textContent = VIDEO_CONFIG.title;
Animation.build(VIDEO_CONFIG);
Animation.update(0, VIDEO_CONFIG);

function updateFrame() {
  const time = audio.currentTime || 0;
  Animation.update(time, VIDEO_CONFIG);

  const seconds = Math.floor(time);
  timeLabel.textContent =
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  if (!audio.paused && !audio.ended) {
    animationFrame = requestAnimationFrame(updateFrame);
  } else {
    animationFrame = null;
  }
}

function stopFrameLoop() {
  if (animationFrame !== null) cancelAnimationFrame(animationFrame);
  animationFrame = null;
}

playButton.addEventListener("click", async () => {
  if (isLoading) return;

  if (!audio.paused) {
    AudioController.pause();
    stopFrameLoop();
    playButton.textContent = "PLAY";
    return;
  }

  try {
    await AudioController.play();
    playButton.textContent = "PAUSE";
    stopFrameLoop();
    updateFrame();
  } catch (error) {
    // AbortError pode ocorrer se o usuário trocar o áudio durante play().
    // Nesse caso, não exibimos como falha fatal.
    if (error.name !== "AbortError") {
      console.error("Não foi possível reproduzir o áudio:", error);
      playButton.textContent = "PLAY";
    }
  }
});

audioFile.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  isLoading = true;
  playButton.disabled = true;
  playButton.textContent = "CARREGANDO…";
  stopFrameLoop();
  AudioController.pause();

  try {
    const loaded = await AudioController.load(file);
    if (loaded) {
      Animation.update(0, VIDEO_CONFIG);
      timeLabel.textContent = "00:00";
      playButton.textContent = "PLAY";
    }
  } catch (error) {
    console.error(error);
    playButton.textContent = "ERRO NO ÁUDIO";
  } finally {
    isLoading = false;
    playButton.disabled = false;
  }
});

audio.addEventListener("timeupdate", () => Animation.update(audio.currentTime, VIDEO_CONFIG));
audio.addEventListener("seeked", () => Animation.update(audio.currentTime, VIDEO_CONFIG));
audio.addEventListener("ended", () => {
  stopFrameLoop();
  playButton.textContent = "PLAY";
  Animation.update(audio.currentTime, VIDEO_CONFIG);
});
audio.addEventListener("pause", () => {
  if (audio.ended) return;
  stopFrameLoop();
  playButton.textContent = "PLAY";
});
