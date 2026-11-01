const playButton = document.getElementById("playButton");
const audioFile = document.getElementById("audioFile");
const timeLabel = document.getElementById("timeLabel");
const audio = document.getElementById("audio");

document.documentElement.style.setProperty("--accent", VIDEO_CONFIG.accent);
document.getElementById("trackLabel").textContent = VIDEO_CONFIG.title;

Animation.build(VIDEO_CONFIG);

function renderFrame() {
  const time = audio.currentTime || 0;
  Animation.update(time, VIDEO_CONFIG);

  const seconds = Math.floor(time);
  timeLabel.textContent =
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  if (!audio.paused && !audio.ended) requestAnimationFrame(renderFrame);
}

playButton.addEventListener("click", async () => {
  try {
    if (audio.paused) {
      await audio.play();
      playButton.textContent = "PAUSE";
      renderFrame();
    } else {
      audio.pause();
      playButton.textContent = "PLAY";
    }
  } catch (error) {
    console.error("Não foi possível reproduzir o áudio:", error);
  }
});

audioFile.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  audio.src = URL.createObjectURL(file);
  audio.load();
  audio.currentTime = 0;
  Animation.update(0, VIDEO_CONFIG);
  playButton.textContent = "PLAY";
});

audio.addEventListener("ended", () => {
  playButton.textContent = "PLAY";
});
audio.addEventListener("seeked", () => Animation.update(audio.currentTime, VIDEO_CONFIG));

// Atualiza a composição quando o usuário pausa ou avança/retrocede a faixa.
audio.addEventListener("timeupdate", () => Animation.update(audio.currentTime, VIDEO_CONFIG));
