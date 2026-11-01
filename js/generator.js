/**
 * GERADOR DE LETRAS, CENAS E ANÁLISE DE ÁUDIO
 * Cria cenas sincronizadas de código e frases tipográficas para o Code Music Video.
 */
const Generator = (() => {
  // Limpa o nome do arquivo para exibir como título da faixa
  function cleanTrackTitle(fileName) {
    if (!fileName) return "VISUAL EXPERIMENT / 001";
    let name = fileName.replace(/\.[^/.]+$/, "");
    name = name.replace(/[[\]()]/g, " ");
    name = name.replace(/[_\-+]+/g, " ");
    name = name.replace(/^\d+[\s.-]+/, "");
    name = name.replace(/\s+/g, " ").trim().toUpperCase();
    return name || "AUDIO TRACK";
  }

  // Analisa o buffer do áudio via Web Audio API para extrair duração, energia e picos
  async function analyzeAudio(file) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx || !file) {
      return { duration: 0, peaks: [], energyProfile: [], avgEnergy: 0 };
    }

    let ctx = null;
    try {
      ctx = new AudioCtx();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const duration = audioBuffer.duration;
      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;

      // Pedaços de 200ms para análise de envelope RMS
      const chunkSize = Math.max(1, Math.floor(sampleRate * 0.2));
      const numChunks = Math.floor(channelData.length / chunkSize);
      const energyProfile = new Float32Array(numChunks);
      let totalEnergy = 0;

      for (let i = 0; i < numChunks; i++) {
        let sum = 0;
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, channelData.length);
        const count = end - start;
        // Pula de 4 em 4 amostras para processamento ultrarrápido
        for (let j = start; j < end; j += 4) {
          sum += channelData[j] * channelData[j];
        }
        const rms = Math.sqrt(sum / (count / 4));
        energyProfile[i] = rms;
        totalEnergy += rms;
      }

      const avgEnergy = totalEnergy / (numChunks || 1);
      const peakThreshold = avgEnergy * 1.35;
      const peaks = [];

      // Detecta momentos de pico (drops / transições fortes)
      for (let i = 1; i < numChunks - 1; i++) {
        if (
          energyProfile[i] > peakThreshold &&
          energyProfile[i] > energyProfile[i - 1] &&
          energyProfile[i] > energyProfile[i + 1]
        ) {
          peaks.push(+(i * 0.2).toFixed(2));
        }
      }

      return { duration, avgEnergy, peaks, energyProfile };
    } catch (err) {
      console.warn("Análise de áudio offline falhou, usando duração padrão:", err);
      return { duration: 0, peaks: [], energyProfile: [], avgEnergy: 0 };
    } finally {
      if (ctx && ctx.state !== "closed") {
        ctx.close().catch(() => {});
      }
    }
  }

  // Gera interpolação de câmera cinemática
  function createCamera(startTime, endTime) {
    const startScale = +(1.0 + Math.random() * 0.08).toFixed(2);
    const endScale = +(startScale + 0.12 + Math.random() * 0.08).toFixed(2);
    const startRot = +(Math.random() * 2.4 - 1.2).toFixed(1);
    const endRot = +(Math.random() * 2.8 - 1.4).toFixed(1);
    const moveX = +(Math.random() * 4 - 2).toFixed(1);
    const moveY = +(Math.random() * 4 - 2).toFixed(1);

    return [
      { at: startTime, x: 0, y: 0, scale: startScale, rotate: startRot },
      { at: endTime, x: moveX, y: moveY, scale: endScale, rotate: endRot }
    ];
  }

  // Banco de dados temático de código e música para geração procedural
  const CYBER_CODE_PATTERNS = [
    {
      lines: [
        { text: "const ", highlight: "frequency", rest: " = audio.connect();" },
        { text: "  pulse.", highlight: "resonate", rest: "({ sub: true });", comment: "bass engaged", tag: "SUB" },
        { text: "  return ", highlight: "amplify", rest: "(waveform);" },
        { text: "};", cursor: true }
      ]
    },
    {
      lines: [
        { text: "while (", highlight: "sound.isPlaying", rest: ") {" },
        { text: "  synthesizer.", highlight: "modulate", rest: "(vibe);", comment: "44.1kHz stereo", tag: "DSP" },
        { text: "  echo.", highlight: "repeat", rest: "(groove);" },
        { text: "}", cursor: true }
      ]
    },
    {
      lines: [
        { text: "async function ", highlight: "dropBeat", rest: "() {" },
        { text: "  await ", highlight: "lowFrequency", rest: ".ignite();", comment: "drop active", tag: "BASS" },
        { text: "  spectrum.", highlight: "overdrive", rest: "(128);" },
        { text: "}", cursor: true }
      ]
    },
    {
      lines: [
        { text: "class ", highlight: "MelodyEngine", rest: " extends Audio {" },
        { text: "  track = ", highlight: "waveform", rest: ".decode();", comment: "zero latency" },
        { text: "  emit(", highlight: "electricVibe", rest: ");", tag: "SYNC" },
        { text: "}", cursor: true }
      ]
    },
    {
      lines: [
        { text: "if (", highlight: "volume.isMax", rest: ") {" },
        { text: "  shatter(", highlight: "frequencies", rest: ");", comment: "distortion limit", tag: "CLIMAX" },
        { text: "  rewind.", highlight: "loop", rest: "(forever);" },
        { text: "}", cursor: true }
      ]
    },
    {
      lines: [
        { text: "const ", highlight: "heartbeat", rest: " = tempo.detect();" },
        { text: "  rhythm.", highlight: "sync", rest: "({ bpm: 128 });", comment: "in the pocket", tag: "RHYTHM" },
        { text: "  export ", highlight: "passion", rest: "(music);" },
        { text: "};", cursor: true }
      ]
    }
  ];

  const PHRASE_PATTERNS = [
    {
      eyebrow: "AUDIO PROTOCOL",
      text: "FEEL THE SOUND",
      highlight: "ELECTRIC NOISE",
      smallText: "when low frequencies shatter the digital barrier."
    },
    {
      eyebrow: "DROP INCOMING",
      text: "RAW BASS",
      highlight: "OVERDRIVE",
      smallText: "pure oscillation traveling at the speed of light."
    },
    {
      eyebrow: "FREQUENCY SPECTRUM",
      text: "SYSTEM",
      highlight: "UNSTOPPABLE",
      smallText: "the algorithm dances to the heartbeat of the track."
    },
    {
      eyebrow: "SONIC RESONANCE",
      text: "MAXIMUM",
      highlight: "AMPLITUDE",
      smallText: "no boundaries between code, sound and emotion."
    },
    {
      eyebrow: "TRANSMISSION",
      text: "ZERO LATENCY",
      highlight: "INFINITE VIBE",
      smallText: "echoing through the circuits of the machine."
    },
    {
      eyebrow: "CLIMAX",
      text: "BREAK THE LOOP",
      highlight: "IGNITE",
      smallText: "where logic ends, music takes total control."
    }
  ];

  // Gera cenas procedurais cobrindo toda a duração do áudio
  function generateProcedural(duration, analysis = {}, trackTitle = "TRACK", theme = "cyber") {
    const scenes = [];
    const safeDuration = Math.max(duration || 0, 15);
    const peaks = analysis.peaks || [];
    let currentTime = 0;
    let sceneIndex = 0;

    while (currentTime < safeDuration - 0.5) {
      sceneIndex++;
      const remaining = safeDuration - currentTime;
      // Duração de cada cena: 4.5s a 7s
      const targetDuration = remaining <= 7.5 ? remaining : +(Math.min(6.5, Math.max(4.2, remaining > 14 ? (4.5 + Math.random() * 2) : remaining))).toFixed(2);
      const endTime = +(currentTime + targetDuration).toFixed(2);

      // Detecta se há um pico de batida neste intervalo ou a cada ~3 cenas
      const isPeak = peaks.some(p => p >= currentTime && p < endTime) || (sceneIndex % 3 === 0);
      const sceneType = isPeak ? "phrase" : "code";
      const camera = createCamera(currentTime, endTime);

      if (sceneType === "code") {
        const pattern = CYBER_CODE_PATTERNS[(sceneIndex - 1) % CYBER_CODE_PATTERNS.length];
        const step = targetDuration / (pattern.lines.length + 0.5);
        const lines = pattern.lines.map((l, idx) => ({
          at: +(currentTime + 0.15 + idx * step).toFixed(2),
          duration: +(step * 0.85).toFixed(2),
          text: l.text,
          highlight: l.highlight,
          rest: l.rest,
          comment: l.comment,
          commentAt: l.comment ? +(currentTime + 0.15 + idx * step + step * 0.5).toFixed(2) : undefined,
          tag: l.tag,
          tagAt: l.tag ? +(currentTime + 0.15 + idx * step + step * 0.7).toFixed(2) : undefined,
          cursor: l.cursor
        }));

        scenes.push({
          type: "code",
          start: currentTime,
          end: endTime,
          transition: (sceneIndex % 4 === 0) ? "glitch" : "blur",
          camera,
          lines
        });
      } else {
        const pattern = PHRASE_PATTERNS[(sceneIndex - 1) % PHRASE_PATTERNS.length];
        scenes.push({
          type: "phrase",
          start: currentTime,
          end: endTime,
          transition: "glitch",
          camera,
          eyebrow: sceneIndex === 1 ? trackTitle : pattern.eyebrow,
          text: pattern.text,
          highlight: pattern.highlight,
          smallText: pattern.smallText
        });
      }

      currentTime = endTime;
    }

    return scenes;
  }

  // Parser para arquivos .LRC sincronizados
  function parseLRC(lrcText) {
    if (!lrcText) return [];
    const lines = lrcText.split(/\r?\n/);
    const result = [];
    const regex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\](.*)/;

    for (const line of lines) {
      const match = line.match(regex);
      if (match) {
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        const ms = match[3] ? parseInt(match[3].padEnd(3, "0").slice(0, 3), 10) : 0;
        const totalSec = +(min * 60 + sec + ms / 1000).toFixed(2);
        const text = match[4].trim();
        if (text) {
          result.push({ time: totalSec, text });
        }
      }
    }
    return result.sort((a, b) => a.time - b.time);
  }

  // Gera cenas a partir de arquivo .LRC sincronizado
  function generateFromLRC(lrcLines, totalDuration, trackTitle = "TRACK") {
    const scenes = [];
    if (!lrcLines || !lrcLines.length) return scenes;

    let currentGroup = [];
    for (let i = 0; i < lrcLines.length; i++) {
      const item = lrcLines[i];
      const prev = lrcLines[i - 1];

      if (prev && (item.time - prev.time > 4.5 || currentGroup.length >= 3)) {
        scenes.push(buildLrcScene(currentGroup, item.time, trackTitle));
        currentGroup = [];
      }
      currentGroup.push(item);
    }

    if (currentGroup.length > 0) {
      const lastTime = currentGroup[currentGroup.length - 1].time;
      const endTime = +(Math.max(lastTime + 5, totalDuration || (lastTime + 5))).toFixed(2);
      scenes.push(buildLrcScene(currentGroup, endTime, trackTitle));
    }

    // Se a primeira cena começa após 1.5s, cria intro
    if (scenes.length > 0 && scenes[0].start > 1.5) {
      scenes.unshift({
        type: "phrase",
        start: 0,
        end: scenes[0].start,
        transition: "blur",
        camera: createCamera(0, scenes[0].start),
        eyebrow: "INTRO",
        text: trackTitle,
        highlight: "CONNECTED",
        smallText: "transmitting audio signal..."
      });
    }

    return scenes;
  }

  function buildLrcScene(group, nextTime, trackTitle) {
    const startTime = group[0].time;
    const endTime = +(nextTime || (startTime + 5)).toFixed(2);
    const dur = Math.max(0.5, endTime - startTime);
    const camera = createCamera(startTime, endTime);

    // Se tiver 1 linha curta e em caixa alta, vira cena de frase
    const isPhrase = group.length === 1 && (group[0].text.length < 35);
    if (isPhrase) {
      const words = group[0].text.split(" ");
      const highlight = words.length > 1 ? words[words.length - 1] : group[0].text;
      const title = words.length > 1 ? words.slice(0, -1).join(" ") : group[0].text;
      return {
        type: "phrase",
        start: startTime,
        end: endTime,
        transition: "glitch",
        camera,
        eyebrow: trackTitle || "VOCALS",
        text: title.toUpperCase(),
        highlight: highlight.toUpperCase(),
        smallText: group[0].text
      };
    }

    const lines = group.map((item, idx) => {
      const words = item.text.split(" ");
      const keyword = words.find(w => w.length > 4) || words[0] || "lyric";
      const cleanKeyword = keyword.replace(/[^a-zA-Z0-9À-ÿ]/g, "");
      return {
        at: +(item.time).toFixed(2),
        duration: +(dur / group.length).toFixed(2),
        text: idx === 0 ? "const " : "  lyrics.",
        highlight: cleanKeyword || "voice",
        rest: ` = "${item.text.replace(/"/g, '\\"')}";`,
        cursor: idx === group.length - 1
      };
    });

    return {
      type: "code",
      start: startTime,
      end: endTime,
      transition: "blur",
      camera,
      lines
    };
  }

  // Gera cenas a partir de texto puro de letra colado pelo usuário
  function generateFromPlainText(text, totalDuration, analysis = {}, trackTitle = "TRACK") {
    if (!text || !text.trim()) {
      return generateProcedural(totalDuration, analysis, trackTitle);
    }

    const rawLines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const sections = [];
    let current = { type: "verse", name: "VERSE", lines: [] };

    for (const line of rawLines) {
      const tagMatch = line.match(/^\[(.*?)\]$/);
      if (tagMatch) {
        if (current.lines.length > 0) sections.push(current);
        const name = tagMatch[1].toUpperCase();
        const isChorus = name.includes("CHORUS") || name.includes("REFRÃO") || name.includes("DROP") || name.includes("HOOK");
        current = {
          type: isChorus ? "phrase" : "verse",
          name,
          lines: []
        };
      } else {
        current.lines.push(line);
      }
    }
    if (current.lines.length > 0) sections.push(current);

    // Se não encontrou marcações [Verse], divide a cada 3 linhas
    let finalSections = [];
    if (sections.length === 1 && sections[0].lines.length > 4) {
      const all = sections[0].lines;
      for (let i = 0; i < all.length; i += 3) {
        const slice = all.slice(i, i + 3);
        const isChorus = (i / 3) % 3 === 2;
        finalSections.push({
          type: isChorus ? "phrase" : "verse",
          name: isChorus ? "CHORUS" : `SECTION ${Math.floor(i / 3) + 1}`,
          lines: slice
        });
      }
    } else {
      finalSections = sections;
    }

    const safeDuration = Math.max(totalDuration || 0, finalSections.length * 5);
    const sceneDuration = +(safeDuration / (finalSections.length || 1)).toFixed(2);
    const scenes = [];

    finalSections.forEach((sec, idx) => {
      const startTime = +(idx * sceneDuration).toFixed(2);
      const endTime = +((idx + 1) * sceneDuration).toFixed(2);
      const camera = createCamera(startTime, endTime);

      if (sec.type === "phrase") {
        const main = sec.lines[0] || trackTitle;
        const words = main.split(" ");
        const highlight = words.length > 1 ? words[words.length - 1] : main;
        const title = words.length > 1 ? words.slice(0, -1).join(" ") : main;
        scenes.push({
          type: "phrase",
          start: startTime,
          end: endTime,
          transition: "glitch",
          camera,
          eyebrow: sec.name,
          text: title.toUpperCase(),
          highlight: highlight.toUpperCase(),
          smallText: sec.lines.slice(1).join(" — ") || main
        });
      } else {
        const step = +(sceneDuration / (sec.lines.length + 0.5)).toFixed(2);
        const lines = sec.lines.map((l, lIdx) => {
          const words = l.split(" ");
          const keyword = words.find(w => w.length > 4) || words[0] || "verse";
          const cleanKeyword = keyword.replace(/[^a-zA-Z0-9À-ÿ]/g, "");
          return {
            at: +(startTime + 0.2 + lIdx * step).toFixed(2),
            duration: +(step * 0.85).toFixed(2),
            text: lIdx === 0 ? "const " : "  sing.",
            highlight: cleanKeyword,
            rest: ` = "${l.replace(/"/g, '\\"')}";`,
            comment: lIdx === 1 ? sec.name.toLowerCase() : undefined,
            commentAt: lIdx === 1 ? +(startTime + 0.2 + lIdx * step + step * 0.6).toFixed(2) : undefined,
            tag: lIdx === 0 ? "VOCAL" : undefined,
            tagAt: lIdx === 0 ? +(startTime + 0.2 + lIdx * step + step * 0.7).toFixed(2) : undefined,
            cursor: lIdx === sec.lines.length - 1
          };
        });

        scenes.push({
          type: "code",
          start: startTime,
          end: endTime,
          transition: "blur",
          camera,
          lines
        });
      }
    });

    return scenes;
  }

  return {
    cleanTrackTitle,
    analyzeAudio,
    generateProcedural,
    parseLRC,
    generateFromLRC,
    generateFromPlainText
  };
})();
