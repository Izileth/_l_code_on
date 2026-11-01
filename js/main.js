// Script principal: integra controlador de áudio, gerador de letras e animações.
(() => {
  // Elementos do DOM
  const stage = document.getElementById("stage");
  const playButton = document.getElementById("playButton");
  const audioFile = document.getElementById("audioFile");
  const audioFileLabel = document.getElementById("audioFileLabel");
  const lyricsButton = document.getElementById("lyricsButton");
  const trackLabel = document.getElementById("trackLabel");
  const timeLabel = document.getElementById("timeLabel");
  const timelineContainer = document.getElementById("timelineContainer");
  const timelineFill = document.getElementById("timelineFill");
  const dropOverlay = document.getElementById("dropOverlay");
  const toast = document.getElementById("toast");

  // Elementos do Modal de Letras
  const lyricsModal = document.getElementById("lyricsModal");
  const modalBackdrop = document.getElementById("modalBackdrop");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const tabButtons = document.querySelectorAll(".modal-tabs .tab-btn");
  const tabPanels = document.querySelectorAll(".modal-body .tab-panel");
  const themeSelect = document.getElementById("themeSelect");
  const colorDots = document.querySelectorAll(".color-dot");
  const btnAutoGenerate = document.getElementById("btnAutoGenerate");
  const lyricsInput = document.getElementById("lyricsInput");
  const lrcFileInput = document.getElementById("lrcFileInput");
  const btnApplyCustomLyrics = document.getElementById("btnApplyCustomLyrics");
  const btnSpeechToText = document.getElementById("btnSpeechToText");
  const btnExportJson = document.getElementById("btnExportJson");
  const btnApplyScenes = document.getElementById("btnApplyScenes");
  const sceneCountLabel = document.getElementById("sceneCount");
  const scenesList = document.getElementById("scenesList");

  // Estado da aplicação
  let currentConfig = { ...VIDEO_CONFIG };
  let currentAccent = VIDEO_CONFIG.accent || "#ed123b";
  let lastAnalysis = null;
  let animationFrame = null;
  let isProcessingAudio = false;
  let toastTimer = null;

  // Inicialização inicial
  document.documentElement.style.setProperty("--accent", currentAccent);
  trackLabel.textContent = currentConfig.title;
  Animation.build(currentConfig);
  Animation.update(0, currentConfig);
  updateSceneListUI();

  // Helper de formatação de tempo (mm:ss)
  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    const sec = Math.floor(seconds);
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  // Notificação Toast
  function showToast(message, duration = 3200) {
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = setTimeout(() => {
      toast.classList.remove("is-visible");
      toastTimer = null;
    }, duration);
  }

  // Loop de atualização de quadros
  function updateFrame() {
    const time = AudioController.getCurrentTime();
    const duration = AudioController.getDuration();
    const energy = AudioController.getEnergy();

    Animation.update(time, currentConfig, energy);

    timeLabel.textContent = `${formatTime(time)} / ${formatTime(duration)}`;

    if (duration > 0) {
      const progress = Math.min(100, Math.max(0, (time / duration) * 100));
      timelineFill.style.width = `${progress}%`;
    } else {
      timelineFill.style.width = "0%";
    }

    if (AudioController.isPlaying()) {
      animationFrame = requestAnimationFrame(updateFrame);
    } else {
      animationFrame = null;
    }
  }

  function stopFrameLoop() {
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  }

  // Processa arquivo de áudio carregado e gera automaticamente as letras
  async function handleAudioFile(file) {
    if (!file || isProcessingAudio) return;

    isProcessingAudio = true;
    playButton.disabled = true;
    playButton.textContent = "CARREGANDO…";
    stopFrameLoop();
    AudioController.pause();
    showToast("ANALISANDO ÁUDIO E GERANDO LETRAS...");

    try {
      const title = Generator.cleanTrackTitle(file.name);
      trackLabel.textContent = title;

      // Executa análise espectral do áudio em paralelo com o carregamento no player
      const [analysis, loaded] = await Promise.all([
        Generator.analyzeAudio(file),
        AudioController.load(file)
      ]);

      if (!loaded) throw new Error("Falha ao registrar fonte do áudio.");

      lastAnalysis = analysis;
      const audioDuration = analysis.duration || AudioController.getDuration();

      // Gera as cenas e letras procedurais para toda a duração da música
      const scenes = Generator.generateProcedural(
        audioDuration,
        analysis,
        title,
        themeSelect.value
      );

      currentConfig = {
        title,
        accent: currentAccent,
        scenes
      };

      Animation.build(currentConfig);
      Animation.update(0, currentConfig);

      timeLabel.textContent = `00:00 / ${formatTime(audioDuration)}`;
      timelineFill.style.width = "0%";
      playButton.textContent = "PLAY";

      updateSceneListUI();
      showToast(`Áudio conectado! ${scenes.length} cenas geradas.`);
    } catch (err) {
      console.error("Erro no processamento do áudio:", err);
      showToast("Erro ao processar este áudio.");
      playButton.textContent = "ERRO";
    } finally {
      isProcessingAudio = false;
      playButton.disabled = false;
      audioFile.value = ""; // Permite selecionar o mesmo arquivo novamente
    }
  }

  // Reprodução / Pausa
  playButton.addEventListener("click", async () => {
    if (isProcessingAudio) return;

    const audioEl = AudioController.getElement();
    if (!audioEl.src) {
      showToast("Carregue um arquivo de música primeiro!");
      audioFile.click();
      return;
    }

    if (AudioController.isPlaying()) {
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
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Erro ao reproduzir:", err);
        showToast("Não foi possível iniciar a reprodução.");
        playButton.textContent = "PLAY";
      }
    }
  });

  // Evento do input de arquivo de áudio
  audioFile.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleAudioFile(file);
  });

  // Linha do tempo interativa (clicar para avançar/retroceder)
  timelineContainer.addEventListener("click", (e) => {
    const duration = AudioController.getDuration();
    if (!duration) return;

    const rect = timelineContainer.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = ratio * duration;

    AudioController.seek(targetTime);
    Animation.update(targetTime, currentConfig);
    timeLabel.textContent = `${formatTime(targetTime)} / ${formatTime(duration)}`;
    timelineFill.style.width = `${ratio * 100}%`;
  });

  // Eventos do elemento de áudio
  const audioElement = AudioController.getElement();
  audioElement.addEventListener("timeupdate", () => {
    if (!AudioController.isPlaying()) {
      const time = AudioController.getCurrentTime();
      const dur = AudioController.getDuration();
      Animation.update(time, currentConfig);
      timeLabel.textContent = `${formatTime(time)} / ${formatTime(dur)}`;
      if (dur > 0) timelineFill.style.width = `${(time / dur) * 100}%`;
    }
  });

  audioElement.addEventListener("ended", () => {
    stopFrameLoop();
    playButton.textContent = "PLAY";
    timelineFill.style.width = "100%";
    Animation.update(AudioController.getDuration(), currentConfig);
  });

  audioElement.addEventListener("pause", () => {
    if (audioElement.ended) return;
    stopFrameLoop();
    playButton.textContent = "PLAY";
  });

  // Suporte a Drag and Drop no palco
  ["dragenter", "dragover"].forEach((eventName) => {
    stage.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropOverlay.classList.add("is-dragover");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    stage.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (eventName === "dragleave" && e.target === dropOverlay) {
        dropOverlay.classList.remove("is-dragover");
      }
    });
  });

  stage.addEventListener("drop", (e) => {
    dropOverlay.classList.remove("is-dragover");
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file && file.type.startsWith("audio/")) {
      handleAudioFile(file);
    } else {
      showToast("Por favor, solte um arquivo de áudio válido.");
    }
  });

  // -------------------------
  // MODAL E GERADOR DE LETRAS
  // -------------------------
  function openModal() {
    lyricsModal.hidden = false;
    updateSceneListUI();
  }

  function closeModal() {
    lyricsModal.hidden = true;
  }

  lyricsButton.addEventListener("click", openModal);
  closeModalBtn.addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", closeModal);

  // Troca de abas do modal
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      tabPanels.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const targetPanel = document.getElementById(btn.dataset.tab);
      if (targetPanel) targetPanel.classList.add("active");
    });
  });

  // Seleção de cor de destaque
  colorDots.forEach((dot) => {
    dot.addEventListener("click", () => {
      colorDots.forEach((d) => d.classList.remove("active"));
      dot.classList.add("active");
      currentAccent = dot.dataset.color;
      currentConfig.accent = currentAccent;
      document.documentElement.style.setProperty("--accent", currentAccent);
    });
  });

  // Botão: Gerar Cenas Automáticas do Áudio
  btnAutoGenerate.addEventListener("click", () => {
    const duration = AudioController.getDuration() || (lastAnalysis && lastAnalysis.duration) || 30;
    const title = currentConfig.title || "VISUAL EXPERIMENT";

    const scenes = Generator.generateProcedural(
      duration,
      lastAnalysis || {},
      title,
      themeSelect.value
    );

    currentConfig.scenes = scenes;
    Animation.build(currentConfig);
    Animation.update(AudioController.getCurrentTime(), currentConfig);
    updateSceneListUI();
    closeModal();
    showToast(`⚡ ${scenes.length} cenas geradas e sincronizadas!`);
  });

  // Botão: Sincronizar Letra Personalizada ou LRC
  btnApplyCustomLyrics.addEventListener("click", () => {
    const text = lyricsInput.value.trim();
    if (!text) {
      showToast("Digite ou cole a letra antes de sincronizar.");
      return;
    }

    const duration = AudioController.getDuration() || (lastAnalysis && lastAnalysis.duration) || 60;
    const title = currentConfig.title || "VOCAL TRACK";

    let scenes = [];
    const lrcLines = Generator.parseLRC(text);

    if (lrcLines.length > 0) {
      scenes = Generator.generateFromLRC(lrcLines, duration, title);
      showToast(`Formato LRC detectado! ${scenes.length} cenas geradas.`);
    } else {
      scenes = Generator.generateFromPlainText(text, duration, lastAnalysis || {}, title);
      showToast(`Letra convertida! ${scenes.length} cenas geradas.`);
    }

    currentConfig.scenes = scenes;
    Animation.build(currentConfig);
    Animation.update(AudioController.getCurrentTime(), currentConfig);
    updateSceneListUI();
    closeModal();
  });

  // Importar arquivo .lrc ou .txt
  lrcFileInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      lyricsInput.value = evt.target.result;
      showToast("Arquivo de letra carregado no editor.");
    };
    reader.readAsText(file);
    lrcFileInput.value = "";
  });

  // Reconhecimento de fala / Ditar com microfone (Web Speech API)
  btnSpeechToText.addEventListener("click", () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Reconhecimento de fala não suportado neste navegador.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = false;

    showToast("🎙️ Ouvindo... Fale a letra da música.");
    btnSpeechToText.textContent = "🔴 OUVINDO...";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript + "\n";
      }
      lyricsInput.value = (lyricsInput.value ? lyricsInput.value + "\n" : "") + transcript;
    };

    recognition.onerror = (err) => {
      console.warn("Erro no reconhecimento de voz:", err);
      btnSpeechToText.textContent = "🎙️ DITAR / VOZ";
      showToast("Gravação finalizada ou sem sinal.");
    };

    recognition.onend = () => {
      btnSpeechToText.textContent = "🎙️ DITAR / VOZ";
    };

    try {
      recognition.start();
    } catch (e) {
      recognition.stop();
    }
  });

  // Atualiza lista de cenas no modal
  function updateSceneListUI() {
    const scenes = currentConfig.scenes || [];
    sceneCountLabel.textContent = scenes.length;

    if (!scenes.length) {
      scenesList.innerHTML = '<p class="empty-msg">Nenhuma cena gerada ainda.</p>';
      return;
    }

    scenesList.innerHTML = scenes
      .map((s, idx) => {
        let preview = "";
        if (s.type === "phrase") {
          preview = `"${s.text} ${s.highlight}"`;
        } else if (s.lines && s.lines.length > 0) {
          preview = s.lines.map((l) => `${l.text}${l.highlight}${l.rest || ""}`).join(" | ");
        }

        return `
        <div class="scene-item">
          <div class="scene-item-header">
            <span>#${String(idx + 1).padStart(2, "0")} [${s.type.toUpperCase()}]</span>
            <span>${formatTime(s.start)} → ${formatTime(s.end)}</span>
          </div>
          <div class="scene-item-body">${preview}</div>
        </div>
      `;
      })
      .join("");
  }

  // Exportar JSON
  btnExportJson.addEventListener("click", () => {
    const json = JSON.stringify(currentConfig, null, 2);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(json).then(() => {
        showToast("JSON copiado para a área de transferência!");
      });
    } else {
      console.log(json);
      showToast("Configuração exibida no console!");
    }
  });

  // Aplicar Cenas
  btnApplyScenes.addEventListener("click", () => {
    Animation.build(currentConfig);
    Animation.update(AudioController.getCurrentTime(), currentConfig);
    closeModal();
    showToast("Cenas aplicadas ao videoclipe!");
  });
})();
