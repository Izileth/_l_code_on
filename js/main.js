const playButton = document.getElementById("playButton");
const audioFile = document.getElementById("audioFile");
const timeLabel = document.getElementById("timeLabel");

document.documentElement.style.setProperty("--accent", VIDEO_CONFIG.accent);
document.getElementById("trackLabel").textContent = VIDEO_CONFIG.title;
renderCode(VIDEO_CONFIG);

playButton.addEventListener("click", async () => {
  try {
    await AudioController.toggle();
    playButton.textContent = AudioController.element.paused ? "PLAY" : "PAUSE";
  } catch (error) {
    console.error("Não foi possível reproduzir o áudio:", error);
  }
});

audioFile.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  await AudioController.load(file);
  playButton.textContent = "PLAY";
});

AudioController.element.addEventListener("timeupdate", () => {
  const seconds = Math.floor(AudioController.element.currentTime);
  timeLabel.textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
});
