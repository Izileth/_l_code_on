// Controlador de áudio com proteção contra carregamentos concorrentes.
const AudioController = (() => {
  const element = document.getElementById("audio");
  let loadVersion = 0;
  let objectUrl = null;

  async function load(file) {
    const currentVersion = ++loadVersion;

    // Interrompe qualquer reprodução anterior antes de trocar a fonte.
    element.pause();
    element.removeAttribute("src");
    element.load();

    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(file);
    element.src = objectUrl;
    element.load();

    // Aguarda o navegador reconhecer o novo arquivo.
    await new Promise((resolve, reject) => {
      const onReady = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error("Não foi possível carregar este arquivo de áudio."));
      };
      const cleanup = () => {
        element.removeEventListener("loadedmetadata", onReady);
        element.removeEventListener("error", onError);
      };

      element.addEventListener("loadedmetadata", onReady, { once: true });
      element.addEventListener("error", onError, { once: true });

      // Alguns formatos podem já estar prontos no momento da verificação.
      if (element.readyState >= HTMLMediaElement.HAVE_METADATA) onReady();
    });

    if (currentVersion !== loadVersion) return false;
    element.currentTime = 0;
    return true;
  }

  async function play() {
    if (!element.src) throw new Error("Carregue um áudio antes de reproduzir.");
    await element.play();
  }

  function pause() {
    element.pause();
  }

  function getElement() {
    return element;
  }

  return { load, play, pause, getElement };
})();
