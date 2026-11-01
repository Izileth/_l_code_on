/**
 * EDITOR DE LETRAS ESTILO CÓDIGO
 * Textarea com highlight de sintaxe, números de linha e atalhos.
 */
const LyricsEditor = (() => {
  let _textarea = null;
  let _highlight = null;
  let _lineNums = null;
  let _container = null;
  let _scrollBusy = false;

  const KEYWORDS = ["VERSE", "CHORUS", "BRIDGE", "INTRO", "OUTRO", "PRE-CHORUS",
    "HOOK", "DROP", "BREAK", "INTERLUDE", "REFRÃO", "VERSO", "PONTE", "CORO"];

  function escape(t) {
    return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function highlightLine(raw) {
    const escaped = escape(raw);

    // LRC timestamp [mm:ss.xx] text
    const lrcMatch = raw.match(/^(\[\d{1,2}:\d{2}(?:\.\d{1,3})?\])\s*(.*)/);
    if (lrcMatch) {
      const ts = escape(lrcMatch[1]);
      const text = escape(lrcMatch[2]);
      return `<span class="le-ts">${ts}</span> <span class="le-lrc-line">${text || "&nbsp;"}</span>`;
    }

    // Section marker [Verse 1] / [Chorus] etc
    const secMatch = raw.match(/^\[([^\]]+)\]$/);
    if (secMatch) {
      const inner = escape(secMatch[1]);
      const upper = inner.toUpperCase();
      const isKnown = KEYWORDS.some(k => upper.includes(k));
      return `<span class="le-sec-bracket">[</span><span class="${isKnown ? "le-sec-keyword" : "le-sec-custom"}">${inner}</span><span class="le-sec-bracket">]</span>`;
    }

    // Comment line starting with # or //
    if (/^\s*(#|\/\/)/.test(raw)) {
      return `<span class="le-comment">${escaped}</span>`;
    }

    // Empty line
    if (!raw.trim()) return "<span>&nbsp;</span>";

    // Regular lyric: highlight words > 5 chars as dim-accent
    const highlighted = escaped.replace(
      /\b([A-Za-zÀ-ÿ]{5,})\b/g,
      (_, w) => `<span class="le-word">${w}</span>`
    );
    return `<span class="le-lyric-line">${highlighted}</span>`;
  }

  function render() {
    if (!_textarea || !_highlight) return;
    const lines = _textarea.value.split("\n");
    _highlight.innerHTML = lines.map(highlightLine).join("\n") + "\n";
    renderLineNums(lines.length);
    syncScroll();
  }

  function renderLineNums(count) {
    if (!_lineNums) return;
    let html = "";
    for (let i = 1; i <= count; i++) {
      html += `<div class="le-ln">${i}</div>`;
    }
    _lineNums.innerHTML = html;
  }

  function syncScroll() {
    if (_scrollBusy) return;
    _scrollBusy = true;
    requestAnimationFrame(() => {
      if (_highlight) _highlight.scrollTop = _textarea.scrollTop;
      if (_lineNums) _lineNums.scrollTop = _textarea.scrollTop;
      _scrollBusy = false;
    });
  }

  function handleKeydown(e) {
    if (e.key === "Tab") {
      e.preventDefault();
      const s = _textarea.selectionStart;
      const en = _textarea.selectionEnd;
      _textarea.value = _textarea.value.slice(0, s) + "  " + _textarea.value.slice(en);
      _textarea.selectionStart = _textarea.selectionEnd = s + 2;
      render();
    }
    if (e.key === "Enter") {
      // Auto-insert space after section tags for nicer UX
      const s = _textarea.selectionStart;
      const before = _textarea.value.slice(0, s);
      const lastLine = before.split("\n").pop() || "";
      if (/^\[.+\]$/.test(lastLine.trim())) {
        // Will get a newline naturally, just re-render
        setTimeout(render, 0);
      }
    }
  }

  function init(containerEl) {
    _container = containerEl;
    _textarea = containerEl.querySelector(".le-textarea");
    _highlight = containerEl.querySelector(".le-highlight");
    _lineNums = containerEl.querySelector(".le-line-nums");

    if (!_textarea) return;

    _textarea.addEventListener("input", render);
    _textarea.addEventListener("scroll", syncScroll);
    _textarea.addEventListener("keydown", handleKeydown);

    render();
  }

  function insertAtCursor(text) {
    if (!_textarea) return;
    const s = _textarea.selectionStart;
    const e = _textarea.selectionEnd;
    const before = _textarea.value.slice(0, s);
    const after = _textarea.value.slice(e);
    const prefix = (before.length > 0 && !before.endsWith("\n")) ? "\n" : "";
    const suffix = (after.length > 0 && !after.startsWith("\n")) ? "\n" : "";
    _textarea.value = before + prefix + text + suffix + after;
    const newCursor = s + prefix.length + text.length + suffix.length;
    _textarea.selectionStart = _textarea.selectionEnd = newCursor;
    _textarea.focus();
    render();
  }

  function insertSection(name) {
    insertAtCursor(`[${name}]`);
  }

  function setValue(text) {
    if (_textarea) {
      _textarea.value = text;
      render();
    }
  }

  function getValue() {
    return _textarea ? _textarea.value : "";
  }

  function setReadOnly(val) {
    if (_textarea) _textarea.readOnly = val;
  }

  function focus() {
    if (_textarea) _textarea.focus();
  }

  // ---- Interim speech results overlay ----
  let _interimEl = null;

  function _findInterimEl() {
    if (_interimEl) return _interimEl;
    if (_container) {
      // Interim element is a sibling right after the wrap
      _interimEl = _container.parentElement
        ? _container.parentElement.querySelector('.le-interim')
        : null;
    }
    return _interimEl;
  }

  /**
   * Show interim (partial) speech recognition text below the editor.
   * Displayed in a muted colour; not saved to the textarea.
   */
  function setInterimText(text) {
    const el = _findInterimEl();
    if (!el) return;
    el.textContent = text;
    el.style.display = text ? 'block' : 'none';
  }

  /**
   * Remove interim text overlay.
   */
  function clearInterim() {
    setInterimText('');
  }

  return { init, setValue, getValue, insertAtCursor, insertSection, setReadOnly, render, focus, setInterimText, clearInterim };
})();
