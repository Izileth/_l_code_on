// Controlador de áudio com suporte a análise de espectro e proteção concorrente.
const AudioController = (() => {
  const element = document.getElementById("audio");
  let loadVersion = 0;
  let objectUrl = null;
  let audioContext = null;
  let analyserNode = null;
  let sourceNode = null;
  let isAnalyserConnected = false;
  let currentFile = null;

  function initAnalyser() {
    if (isAnalyserConnected) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContext) audioContext = new AudioCtx();
      analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 64; // Rápido e leve para detecção de graves
      sourceNode = audioContext.createMediaElementSource(element);
      sourceNode.connect(analyserNode);
      analyserNode.connect(audioContext.destination);
      isAnalyserConnected = true;
    } catch (e) {
      console.warn("Não foi possível inicializar o analisador de frequência em tempo real:", e);
    }
  }

  async function load(file) {
    const currentVersion = ++loadVersion;
    currentFile = file;

    // Interrompe qualquer reprodução anterior antes de trocar a fonte.
    element.pause();
    element.removeAttribute("src");
    element.load();

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }

    objectUrl = URL.createObjectURL(file);
    element.src = objectUrl;

    // Aguarda o navegador carregar os metadados do áudio.
    await new Promise((resolve, reject) => {
      let settled = false;
      const onReady = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      };
      const onError = () => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error("Não foi possível carregar este arquivo de áudio."));
      };
      const cleanup = () => {
        element.removeEventListener("loadedmetadata", onReady);
        element.removeEventListener("canplay", onReady);
        element.removeEventListener("error", onError);
      };

      element.addEventListener("loadedmetadata", onReady, { once: true });
      element.addEventListener("canplay", onReady, { once: true });
      element.addEventListener("error", onError, { once: true });
      element.load();

      if (element.readyState >= HTMLMediaElement.HAVE_METADATA) {
        onReady();
      }
    });

    if (currentVersion !== loadVersion) return false;
    element.currentTime = 0;
    return true;
  }

  async function play() {
    if (!element.src) throw new Error("Carregue um áudio antes de reproduzir.");
    initAnalyser();
    if (audioContext && audioContext.state === "suspended") {
      await audioContext.resume();
    }
    await element.play();
  }

  function pause() {
    element.pause();
  }

  function seek(time) {
    if (Number.isFinite(time)) {
      element.currentTime = Math.max(0, Math.min(element.duration || 0, time));
    }
  }

  function getDuration() {
    return Number.isFinite(element.duration) ? element.duration : 0;
  }

  function getCurrentTime() {
    return Number.isFinite(element.currentTime) ? element.currentTime : 0;
  }

  function isPlaying() {
    return !element.paused && !element.ended;
  }

  // Retorna a intensidade dos graves (0 a 1) para efeito reativo
  function getEnergy() {
    if (!analyserNode || element.paused) return 0;
    const data = new Uint8Array(analyserNode.frequencyBinCount);
    analyserNode.getByteFrequencyData(data);
    let bass = 0;
    const count = Math.min(4, data.length);
    for (let i = 0; i < count; i++) bass += data[i];
    return bass / (count * 255);
  }

  function getElement() {
    return element;
  }

  function getFile() {
    return currentFile;
  }

  return {
    load,
    play,
    pause,
    seek,
    getDuration,
    getCurrentTime,
    isPlaying,
    getEnergy,
    getElement,
    getFile
  };
})();
