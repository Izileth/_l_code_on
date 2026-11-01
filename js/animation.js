function renderCode(config) {
  const container = document.getElementById("codeLines");
  container.innerHTML = "";

  config.lines.forEach((line, index) => {
    const row = document.createElement("div");
    row.className = "code-line";
    row.style.transform = `translateX(${(index % 3 - 1) * 2.5}%)`;

    const plain = document.createElement("span");
    plain.className = "plain";
    plain.textContent = line.text || "";
    row.appendChild(plain);

    if (line.highlight) {
      const accent = document.createElement("span");
      accent.className = "accent";
      accent.textContent = line.highlight;
      row.appendChild(accent);
    }

    if (line.rest) {
      const rest = document.createElement("span");
      rest.className = "plain";
      rest.textContent = line.rest;
      row.appendChild(rest);
    }

    if (line.cursor) {
      const cursor = document.createElement("span");
      cursor.className = "cursor";
      row.appendChild(cursor);
    }

    if (line.comment) {
      const comment = document.createElement("span");
      comment.className = "comment";
      comment.textContent = `// ${line.comment.replace(/^\/\/\s*/, "")}`;
      row.appendChild(comment);
    }

    if (line.tag) {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = line.tag;
      row.appendChild(tag);
    }

    container.appendChild(row);
  });
}
