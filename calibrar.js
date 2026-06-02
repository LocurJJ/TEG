(function () {
  const params = new URLSearchParams(window.location.search);
  if (!params.has("calibrar")) return;

  if (!params.has("preview")) {
    params.set("preview", "1");
    window.location.replace(`${window.location.pathname}?${params.toString()}`);
    return;
  }

  const MAP_SIZE = 130;
  const IMAGE_X_PADDING = 8;
  const movedPositions = {};
  let active = null;
  let dragged = false;

  injectStyles();
  window.addEventListener("load", boot);

  function boot() {
    document.body.classList.add("calibrating");
    document.addEventListener("click", blockCountryGameEvents, true);
    createPanel();
    bindWhenReady();
  }

  function bindWhenReady() {
    const board = document.querySelector("#board");
    if (!board) {
      window.setTimeout(bindWhenReady, 250);
      return;
    }
    bindCountries(board);
    const observer = new MutationObserver(() => bindCountries(board));
    observer.observe(board, { childList: true });
  }

  function bindCountries(board) {
    board.querySelectorAll(".map-country").forEach((country) => {
      applySavedPosition(country);
      if (country.dataset.calibrationReady) return;
      country.dataset.calibrationReady = "1";
      country.addEventListener("pointerdown", startDrag);
      country.addEventListener("click", blockDraggedClick, true);
    });
  }

  function startDrag(event) {
    if (!event.currentTarget.classList.contains("map-country")) return;
    event.preventDefault();
    event.stopPropagation();
    active = event.currentTarget;
    dragged = false;
    active.setPointerCapture(event.pointerId);
    active.classList.add("dragging-country");
    moveCountry(event, false);
    active.addEventListener("pointermove", moveCountry);
    active.addEventListener("pointerup", stopDrag, { once: true });
    active.addEventListener("pointercancel", stopDrag, { once: true });
  }

  function moveCountry(event, markDragged = true) {
    if (!active) return;
    event.preventDefault();
    event.stopPropagation();
    if (markDragged) dragged = true;
    const board = document.querySelector("#board");
    const rect = board.getBoundingClientRect();
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);
    setCountryPosition(active, x, y);
    movedPositions[getCountryKey(active)] = { left: x, top: y };
  }

  function stopDrag(event) {
    if (!active) return;
    event.preventDefault();
    event.stopPropagation();
    active.releasePointerCapture?.(event.pointerId);
    active.removeEventListener("pointermove", moveCountry);
    active.classList.remove("dragging-country");
    active = null;
  }

  function blockDraggedClick(event) {
    if (!dragged) return;
    event.preventDefault();
    event.stopPropagation();
    dragged = false;
  }

  function blockCountryGameEvents(event) {
    if (!event.target.closest(".map-country")) return;
    event.preventDefault();
    event.stopPropagation();
  }

  function applySavedPosition(country) {
    const saved = movedPositions[getCountryKey(country)];
    if (!saved) return;
    setCountryPosition(country, saved.left, saved.top);
  }

  function setCountryPosition(country, left, top) {
    country.style.setProperty("left", `${left}%`, "important");
    country.style.setProperty("top", `${top}%`, "important");
  }

  function createPanel() {
    const panel = document.createElement("div");
    panel.className = "calibration-panel";
    panel.innerHTML = `
      <strong>Calibrar mapa</strong>
      <button type="button" id="copyCalibration">Copiar coordenadas</button>
      <textarea id="calibrationOutput" spellcheck="false"></textarea>
    `;
    document.body.appendChild(panel);
    panel.querySelector("#copyCalibration").addEventListener("click", copyCoordinates);
  }

  async function copyCoordinates() {
    const output = document.querySelector("#calibrationOutput");
    const text = buildCoordinatesText();
    output.value = text;
    output.classList.add("visible");
    try {
      await navigator.clipboard.writeText(text);
      toast("Coordenadas copiadas.");
    } catch {
      toast("No pude copiar automatico, pero quedaron abajo.");
    }
  }

  function buildCoordinatesText() {
    const rows = Array.from(document.querySelectorAll(".map-country")).map((country) => {
      const key = getCountryKey(country);
      const saved = movedPositions[key];
      const left = saved?.left ?? parseFloat(country.style.left);
      const top = saved?.top ?? parseFloat(country.style.top);
      const x = fromScreenX(left);
      const y = (top / 100) * MAP_SIZE;
      return `    "${key}": [${formatNumber(x)}, ${formatNumber(y)}],`;
    });
    return `  const mapPositions = {\n${rows.join("\n")}\n  };`;
  }

  function getCountryKey(country) {
    const name = country.querySelector(".country-name")?.textContent?.trim() || "";
    return slug(name);
  }

  function fromScreenX(leftPercent) {
    const board = document.querySelector("#board");
    if (!board?.classList.contains("with-board-image")) return (leftPercent / 100) * MAP_SIZE;
    return ((leftPercent - IMAGE_X_PADDING) / (100 - IMAGE_X_PADDING * 2)) * MAP_SIZE;
  }

  function slug(value) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function formatNumber(value) {
    const rounded = Math.round(clamp(value, 0, MAP_SIZE) * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function toast(message) {
    const node = document.createElement("div");
    node.className = "toast calibration-toast";
    node.textContent = message;
    document.body.appendChild(node);
    window.setTimeout(() => node.remove(), 1800);
  }

  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      body.calibrating .map-country {
        cursor: grab;
        touch-action: none;
      }

      body.calibrating .map-country.dragging-country {
        cursor: grabbing;
        opacity: 0.92;
        z-index: 1000;
      }

      .calibration-panel {
        align-items: stretch;
        background: rgba(13, 17, 22, 0.94);
        border: 1px solid var(--accent);
        border-radius: 8px;
        box-shadow: var(--shadow);
        color: var(--text);
        display: grid;
        gap: 8px;
        padding: 10px;
        position: fixed;
        right: 16px;
        top: 16px;
        width: min(360px, calc(100vw - 32px));
        z-index: 2000;
      }

      .calibration-panel strong {
        font-size: 13px;
      }

      .calibration-panel button {
        min-height: 36px;
      }

      .calibration-panel textarea {
        background: #0d1116;
        border: 1px solid var(--line);
        border-radius: 8px;
        color: var(--text);
        display: none;
        font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
        font-size: 11px;
        height: 220px;
        padding: 8px;
        resize: vertical;
        text-transform: none;
        white-space: pre;
      }

      .calibration-panel textarea.visible {
        display: block;
      }
    `;
    document.head.appendChild(style);
  }
})();
