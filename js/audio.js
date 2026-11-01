const AudioController = {
  element: document.getElementById("audio"),
  async load(file) {
    this.element.src = URL.createObjectURL(file);
    this.element.load();
  },
  toggle() {
    if (this.element.paused) return this.element.play();
    this.element.pause();
  }
};
