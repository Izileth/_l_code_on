const Animation = (() => {
  const stage = document.getElementById("sceneContent");
  let sceneElements = [];

  function createCodeScene(scene) {
    const wrapper = document.createElement("div");
    wrapper.className = "scene-layer code-layer";
    const lines = document.createElement("div");
    lines.className = "code-lines";
    wrapper.appendChild(lines);

    const items = (scene.lines || []).map((line, index) => {
      const row = document.createElement("div");
      row.className = "code-line";
      row.style.transform = `translateX(${(index % 3 - 1) * 2.5}%)`;

      const prefix = document.createElement("span");
      prefix.className = "plain";
      const highlight = document.createElement("span");
      highlight.className = "accent";
      const suffix = document.createElement("span");
      suffix.className = "plain";
      const comment = document.createElement("span");
      comment.className = "comment";
      const cursor = document.createElement("span");
      cursor.className = "cursor";
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = line.tag || "";

      row.append(prefix, highlight, suffix, comment, cursor, tag);
      lines.appendChild(row);
      return { row, prefix, highlight, suffix, comment, cursor, tag, config: line };
    });

    return { wrapper, items };
  }

  function createPhraseScene(scene) {
    const wrapper = document.createElement("div");
    wrapper.className = "scene-layer phrase-layer";
    const eyebrow = document.createElement("div");
    eyebrow.className = "phrase-eyebrow";
    eyebrow.textContent = scene.eyebrow || "";
    const title = document.createElement("div");
    title.className = "phrase-title";
    title.textContent = scene.text || "";
    const highlight = document.createElement("div");
    highlight.className = "phrase-highlight";
    highlight.textContent = scene.highlight || "";
    const small = document.createElement("div");
    small.className = "phrase-small";
    small.textContent = scene.smallText || "";
    wrapper.append(eyebrow, title, highlight, small);
    return { wrapper, items: [] };
  }

  function build(config) {
    stage.replaceChildren();
    sceneElements = [];

    (config.scenes || []).forEach((scene) => {
      const result = scene.type === "phrase"
        ? createPhraseScene(scene)
        : createCodeScene(scene);
      result.wrapper.dataset.transition = scene.transition || "blur";
      stage.appendChild(result.wrapper);
      sceneElements.push({ ...result, config: scene });
    });
  }

  function typeProgress(text, progress) {
    const count = Math.max(0, Math.min(text.length, Math.floor(text.length * progress)));
    return text.slice(0, count);
  }

  function cameraAt(points, time) {
    if (!points || !points.length) return { x: 0, y: 0, scale: 1, rotate: 0 };
    if (time <= points[0].at) return points[0];
    if (time >= points[points.length - 1].at) return points[points.length - 1];

    let a = points[0], b = points[points.length - 1];
    for (let i = 0; i < points.length - 1; i++) {
      if (time >= points[i].at && time <= points[i + 1].at) {
        a = points[i]; b = points[i + 1]; break;
      }
    }
    const raw = (time - a.at) / (b.at - a.at);
    const t = raw * raw * (3 - 2 * raw);
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      scale: a.scale + (b.scale - a.scale) * t,
      rotate: a.rotate + (b.rotate - a.rotate) * t
    };
  }

  function update(time, config) {
    let activeScene = null;

    sceneElements.forEach((scene) => {
      const c = scene.config;
      const active = time >= c.start && time < c.end;
      scene.wrapper.classList.toggle("is-active", active);
      if (active) activeScene = scene;

      scene.items.forEach((item) => {
        const line = item.config;
        const duration = line.duration || 0.85;
        const progress = Math.max(0, Math.min(1, (time - line.at) / duration));
        const visible = time >= line.at;

        item.row.classList.toggle("is-visible", visible);
        item.prefix.textContent = visible ? typeProgress(line.text || "", progress) : "";
        item.highlight.textContent = progress >= 0.35
          ? typeProgress(line.highlight || "", Math.max(0, (progress - 0.35) / 0.65)) : "";
        item.suffix.textContent = progress >= 0.68
          ? typeProgress(line.rest || "", Math.max(0, (progress - 0.68) / 0.32)) : "";

        const commentVisible = line.comment && time >= (line.commentAt ?? line.at + duration);
        item.comment.textContent = commentVisible ? `// ${line.comment}` : "";
        item.comment.classList.toggle("is-visible", Boolean(commentVisible));

        const tagVisible = line.tag && time >= (line.tagAt ?? line.at + duration);
        item.tag.classList.toggle("is-visible", Boolean(tagVisible));
        item.cursor.style.display = line.cursor && visible ? "inline-block" : "none";
      });
    });

    if (activeScene) {
      const camera = cameraAt(activeScene.config.camera, time);
      activeScene.wrapper.style.transform =
        `translate(${camera.x}%, ${camera.y}%) scale(${camera.scale}) rotate(${camera.rotate}deg)`;
    }
  }

  return { build, update };
})();
