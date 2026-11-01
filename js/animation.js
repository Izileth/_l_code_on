const Animation = (() => {
  const container = document.getElementById("codeLines");
  const scene = document.getElementById("codeScene");
  const lineElements = [];

  function makeSpan(className, text = "") {
    const span = document.createElement("span");
    span.className = className;
    span.textContent = text;
    return span;
  }

  function build(config) {
    container.replaceChildren();
    lineElements.length = 0;

    config.lines.forEach((line) => {
      const row = document.createElement("div");
      row.className = "code-line";

      const prefix = makeSpan("plain");
      const highlight = makeSpan("accent");
      const suffix = makeSpan("plain");
      const comment = makeSpan("comment");
      const cursor = makeSpan("cursor");
      const tag = makeSpan("tag", line.tag || "");

      row.append(prefix, highlight, suffix, comment, cursor, tag);
      container.appendChild(row);

      lineElements.push({ row, prefix, highlight, suffix, comment, cursor, tag, config: line });
    });
  }

  function typeProgress(fullText, progress) {
    const count = Math.max(0, Math.min(fullText.length, Math.floor(fullText.length * progress)));
    return fullText.slice(0, count);
  }

  function interpolateCamera(points, time) {
    if (!points || points.length === 0) return { x: 0, y: 0, scale: 1, rotate: 0 };
    if (time <= points[0].at) return points[0];
    if (time >= points[points.length - 1].at) return points[points.length - 1];

    let left = points[0];
    let right = points[points.length - 1];

    for (let i = 0; i < points.length - 1; i++) {
      if (time >= points[i].at && time <= points[i + 1].at) {
        left = points[i];
        right = points[i + 1];
        break;
      }
    }

    const t = (time - left.at) / (right.at - left.at);
    const ease = t * t * (3 - 2 * t); // smoothstep
    return {
      x: left.x + (right.x - left.x) * ease,
      y: left.y + (right.y - left.y) * ease,
      scale: left.scale + (right.scale - left.scale) * ease,
      rotate: left.rotate + (right.rotate - left.rotate) * ease
    };
  }

  function update(time, config) {
    lineElements.forEach((item) => {
      const line = item.config;
      const duration = line.duration || 1.25;
      const progress = Math.max(0, Math.min(1, (time - line.start) / duration));
      const visible = time >= line.start;

      item.row.classList.toggle("is-visible", visible);
      item.prefix.textContent = visible ? typeProgress(line.text || "", progress) : "";
      item.highlight.textContent = visible && progress >= 0.45
        ? typeProgress(line.highlight || "", Math.max(0, (progress - 0.45) / 0.55)) : "";
      item.suffix.textContent = visible && progress >= 0.72
        ? typeProgress(line.rest || "", Math.max(0, (progress - 0.72) / 0.28)) : "";

      const commentVisible = line.comment && time >= (line.commentAt ?? line.start + duration);
      item.comment.textContent = commentVisible ? `// ${line.comment}` : "";
      item.comment.classList.toggle("is-visible", Boolean(commentVisible));

      const tagVisible = line.tag && time >= (line.tagAt ?? line.start + duration);
      item.tag.classList.toggle("is-visible", Boolean(tagVisible));
      item.cursor.style.display = line.cursor && visible ? "inline-block" : "none";
    });

    const camera = interpolateCamera(config.camera, time);
    scene.style.transform =
      `translate(${camera.x}%, ${camera.y}%) scale(${camera.scale}) rotate(${camera.rotate}deg)`;
  }

  return { build, update };
})();
