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
  const colorDots = document.querySelectorAll(".color-dot:not(.color-dot-custom)");
  const customColorPicker = document.getElementById("customColorPicker");
  const btnAutoGenerate = document.getElementById("btnAutoGenerate");
  const lrcFileInput = document.getElementById("lrcFileInput");
  const btnApplyCustomLyrics = document.getElementById("btnApplyCustomLyrics");
  const btnSpeechToText = document.getElementById("btnSpeechToText");
  const btnImportFromAudio = document.getElementById("btnImportFromAudio");
  const btnExportJson = document.getElementById("btnExportJson");
  const btnApplyScenes = document.getElementById("btnApplyScenes");
  const sceneCountLabel = document.getElementById("sceneCount");
  const scenesList = document.getElementById("scenesList");
  const audioStatusBadge = document.getElementById("audioStatusBadge");
  const audioStatusText = document.getElementById("audioStatusText");
  const waveformWrap = document.getElementById("waveformWrap");
  const waveformCanvas = document.getElementById("waveformCanvas");
  const genProgressWrap = document.getElementById("genProgressWrap");
  const genProgressBar = document.getElementById("genProgressBar");
  const genProgressLabel = document.getElementById("genProgressLabel");

  // Estado da aplicação
  let currentConfig = { ...VIDEO_CONFIG };
  let currentAccent = VIDEO_CONFIG.accent || "#ed123b";
  let lastAnalysis = null;
  let animationFrame = null;
  let isProcessingAudio = false;
  let toastTimer = null;
  let currentAudioFile = null;  // referência ao arquivo de áudio carregado
  let activeRecognition = null; // instância ativa de SpeechRecognition

  // ---- Inicialização do LyricsEditor ----
  const leEditorWrap = document.getElementById("leEditorWrap");
  LyricsEditor.init(leEditorWrap);

  // Atalho Ctrl+Enter no textarea para aplicar letras
  const leTextarea = document.getElementById("leTextarea");
  if (leTextarea) {
    leTextarea.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        btnApplyCustomLyrics.click();
      }
    });
  }

  // Toolbar de seções: botões [Verse], [Chorus], etc.
  document.querySelectorAll(".le-tag-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      LyricsEditor.insertSection(btn.dataset.section);
    });
  });

  // Inicialização inicial
  document.documentElement.style.setProperty("--accent", currentAccent);
  trackLabel.textContent = currentConfig.title;
  Animation.build(currentConfig);
  Animation.update(0, currentConfig);
  updateSceneListUI();
  updateAudioStatusBadge();

  // Helper de formatação de tempo (mm:ss)
  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    const sec = Math.floor(seconds);
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  // Formata timestamp para LRC: [mm:ss.xx]
  function formatLrcTimestamp(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    const mm = String(min).padStart(2, "0");
    const ss = String(Math.floor(sec)).padStart(2, "0");
    const cs = String(Math.round((sec % 1) * 100)).padStart(2, "0");
    return `[${mm}:${ss}.${cs}]`;
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

  // Badge de status do áudio no header do modal
  function updateAudioStatusBadge() {
    const audioEl = AudioController.getElement();
    const hasAudio = audioEl && audioEl.src && audioEl.src !== window.location.href;
    if (hasAudio) {
      audioStatusBadge.classList.add("has-audio");
      audioStatusBadge.classList.remove("no-audio");
      const name = currentAudioFile ? currentAudioFile.name : "ÁUDIO CONECTADO";
      audioStatusText.textContent = name.length > 22 ? name.slice(0, 20) + "…" : name;
    } else {
      audioStatusBadge.classList.remove("has-audio");
      audioStatusBadge.classList.add("no-audio");
      audioStatusText.textContent = "SEM ÁUDIO";
    }
  }

  // Desenha o waveform da energyProfile no canvas
  function drawWaveform(energyProfile) {
    if (!energyProfile || !energyProfile.length) return;
    const canvas = waveformCanvas;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const barCount = Math.min(energyProfile.length, 120);
    const step = Math.max(1, Math.floor(energyProfile.length / barCount));
    const barW = Math.max(1, (W / barCount) - 1);
    const maxE = Math.max(...energyProfile, 0.001);

    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#ed123b";

    for (let i = 0; i < barCount; i++) {
      const idx = i * step;
      const val = energyProfile[idx] / maxE;
      const bh = Math.max(2, val * H);
      const x = i * (barW + 1);
      const y = H - bh;

      // Gradient bar
      const grad = ctx.createLinearGradient(x, y, x, H);
      grad.addColorStop(0, accent);
      grad.addColorStop(1, accent + "44");
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barW, bh);
    }
  }

  // Animação de progresso falso de 0→100% durante geração
  function runFakeProgress(onDone) {
    genProgressWrap.style.display = "flex";
    genProgressBar.style.width = "0%";
    genProgressLabel.textContent = "0%";

    let pct = 0;
    const interval = setInterval(() => {
      // Incremento não-linear: rápido no início, lento no fim
      const remaining = 100 - pct;
      pct += Math.max(0.5, remaining * 0.04);
      if (pct >= 98) {
        pct = 98;
        clearInterval(interval);
      }
      genProgressBar.style.width = `${pct}%`;
      genProgressLabel.textContent = `${Math.floor(pct)}%`;
    }, 50);

    return {
      complete() {
        clearInterval(interval);
        genProgressBar.style.width = "100%";
        genProgressLabel.textContent = "100%";
        setTimeout(() => {
          genProgressWrap.style.display = "none";
          genProgressBar.style.width = "0%";
          if (onDone) onDone();
        }, 400);
      }
    };
  }

  // Processa arquivo de áudio carregado e gera automaticamente as letras
  async function handleAudioFile(file) {
    if (!file || isProcessingAudio) return;

    isProcessingAudio = true;
    currentAudioFile = file;
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

      // Mostra waveform se tivermos energyProfile
      if (analysis.energyProfile && analysis.energyProfile.length) {
        waveformWrap.style.display = "block";
        drawWaveform(analysis.energyProfile);
      }

      updateSceneListUI();
      updateAudioStatusBadge();
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
    if (!audioEl.src || audioEl.src === window.location.href) {
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
    // Parar reconhecimento de voz se ainda estiver ativo
    stopActiveRecognition();
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
    updateAudioStatusBadge();
    // Redesenha o waveform ao abrir (caso o accent tenha mudado)
    if (lastAnalysis && lastAnalysis.energyProfile && lastAnalysis.energyProfile.length) {
      waveformWrap.style.display = "block";
      drawWaveform(lastAnalysis.energyProfile);
    }
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

  // Seleção de cor de destaque (dots fixos)
  colorDots.forEach((dot) => {
    dot.addEventListener("click", () => {
      colorDots.forEach((d) => d.classList.remove("active"));
      dot.classList.add("active");
      currentAccent = dot.dataset.color;
      applyAccent(currentAccent);
    });
  });

  // Cor personalizada via color picker
  customColorPicker.addEventListener("input", () => {
    colorDots.forEach((d) => d.classList.remove("active"));
    currentAccent = customColorPicker.value;
    applyAccent(currentAccent);
  });

  function applyAccent(color) {
    currentConfig.accent = color;
    document.documentElement.style.setProperty("--accent", color);
    // Redesenha waveform com nova cor
    if (lastAnalysis && lastAnalysis.energyProfile) {
      drawWaveform(lastAnalysis.energyProfile);
    }
  }

  // Botão: Gerar Cenas Automáticas do Áudio
  btnAutoGenerate.addEventListener("click", () => {
    const duration = AudioController.getDuration() || (lastAnalysis && lastAnalysis.duration) || 30;
    const title = currentConfig.title || "VISUAL EXPERIMENT";

    const progress = runFakeProgress();

    // Defer para deixar a barra de progresso aparecer antes do processamento síncrono
    setTimeout(() => {
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

      progress.complete();

      setTimeout(() => {
        closeModal();
        showToast(`⚡ ${scenes.length} cenas geradas e sincronizadas!`);
      }, 450);
    }, 80);
  });

  // Botão: Sincronizar Letra Personalizada ou LRC
  btnApplyCustomLyrics.addEventListener("click", () => {
    const text = LyricsEditor.getValue().trim();
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
      LyricsEditor.setValue(evt.target.result);
      showToast("Arquivo de letra carregado no editor.");
    };
    reader.readAsText(file);
    lrcFileInput.value = "";
  });

  // ---- Reconhecimento de Fala ----

  function stopActiveRecognition() {
    if (activeRecognition) {
      try { activeRecognition.stop(); } catch (_) {}
      activeRecognition = null;
    }
  }

  // Botão: Ditar com Microfone
  btnSpeechToText.addEventListener("click", () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Reconhecimento de fala não suportado neste navegador.");
      return;
    }

    // Se já estiver gravando, parar
    if (activeRecognition) {
      stopActiveRecognition();
      LyricsEditor.clearInterim();
      btnSpeechToText.textContent = "🎙️ DITAR / VOZ";
      showToast("Gravação finalizada.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = true;

    activeRecognition = recognition;
    showToast("🎙️ Ouvindo... Fale a letra da música.");
    btnSpeechToText.textContent = "🔴 PARAR";

    recognition.onresult = (event) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          LyricsEditor.insertAtCursor(result[0].transcript.trim());
          LyricsEditor.clearInterim();
        } else {
          interimText += result[0].transcript;
        }
      }
      if (interimText) {
        LyricsEditor.setInterimText("…" + interimText);
      }
    };

    recognition.onerror = (err) => {
      console.warn("Erro no reconhecimento de voz:", err);
      btnSpeechToText.textContent = "🎙️ DITAR / VOZ";
      LyricsEditor.clearInterim();
      activeRecognition = null;
      showToast("Gravação finalizada ou sem sinal.");
    };

    recognition.onend = () => {
      btnSpeechToText.textContent = "🎙️ DITAR / VOZ";
      LyricsEditor.clearInterim();
      activeRecognition = null;
    };

    try {
      recognition.start();
    } catch (e) {
      recognition.stop();
      activeRecognition = null;
    }
  });

  // Botão: Importar de Áudio (transcrição sincronizada com timestamps LRC)
  btnImportFromAudio.addEventListener("click", () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Reconhecimento de fala não suportado neste navegador.");
      return;
    }

    // Se já estiver gravando de áudio, parar
    if (activeRecognition) {
      stopActiveRecognition();
      LyricsEditor.clearInterim();
      AudioController.pause();
      stopFrameLoop();
      playButton.textContent = "PLAY";
      btnImportFromAudio.textContent = "🔄 IMPORTAR DE ÁUDIO";
      showToast("Transcrição finalizada.");
      return;
    }

    const audioEl = AudioController.getElement();
    if (!audioEl.src || audioEl.src === window.location.href) {
      showToast("Carregue um arquivo de áudio primeiro!");
      return;
    }

    // Voltar para o início e iniciar
    AudioController.seek(0);

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = true;

    activeRecognition = recognition;
    btnImportFromAudio.textContent = "⏹ PARAR TRANSCRIÇÃO";
    showToast("🔄 Transcrevendo áudio com timestamps LRC...");

    recognition.onresult = (event) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const ts = formatLrcTimestamp(AudioController.getCurrentTime());
          const line = `${ts} ${result[0].transcript.trim()}`;
          // Appenda ao final do editor
          const current = LyricsEditor.getValue();
          const prefix = current && !current.endsWith("\n") ? "\n" : "";
          LyricsEditor.setValue(current + prefix + line + "\n");
          LyricsEditor.clearInterim();
        } else {
          interimText += result[0].transcript;
        }
      }
      if (interimText) {
        const ts = formatLrcTimestamp(AudioController.getCurrentTime());
        LyricsEditor.setInterimText(`${ts} …${interimText}`);
      }
    };


    recognition.onerror = (err) => {
      console.warn("Erro na transcrição:", err);
      btnImportFromAudio.textContent = "🔄 IMPORTAR DE ÁUDIO";
      LyricsEditor.clearInterim();
      activeRecognition = null;
      AudioController.pause();
      stopFrameLoop();
      playButton.textContent = "PLAY";
    };

    recognition.onend = () => {
      btnImportFromAudio.textContent = "🔄 IMPORTAR DE ÁUDIO";
      LyricsEditor.clearInterim();
      activeRecognition = null;
    };

    try {
      recognition.start();
      // Iniciar reprodução do áudio após pequeno delay
      setTimeout(async () => {
        try {
          await AudioController.play();
          playButton.textContent = "PAUSE";
          stopFrameLoop();
          updateFrame();
        } catch (err) {
          console.error("Erro ao reproduzir para transcrição:", err);
        }
      }, 300);
    } catch (e) {
      recognition.stop();
      activeRecognition = null;
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
          <div class="scene-item-actions">
            <button type="button" class="scene-jump-btn" data-start="${s.start}" title="Pular para esta cena">▶ PULAR</button>
          </div>
        </div>
      `;
      })
      .join("");

    // Vincular botões "PULAR" após renderizar
    scenesList.querySelectorAll(".scene-jump-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const start = parseFloat(btn.dataset.start);
        AudioController.seek(start);
        Animation.update(start, currentConfig);
        const dur = AudioController.getDuration();
        timeLabel.textContent = `${formatTime(start)} / ${formatTime(dur)}`;
        if (dur > 0) timelineFill.style.width = `${(start / dur) * 100}%`;
        closeModal();
      });
    });
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
