(function () {
  const CURRENT_ROOM_KEY = "teg2-current-room";
  const nativeSetTimeout = window.setTimeout.bind(window);

  preventBattleReloads();
  prepareRestoreScreen();
  injectStyles();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  function boot() {
    addMapExpandButton();
    watchRestoredGame();
  }

  function preventBattleReloads() {
    window.setTimeout = function (handler, delay, ...args) {
      if (typeof handler === "function" && String(handler).includes("location.reload")) return 0;
      return nativeSetTimeout(handler, delay, ...args);
    };
  }

  function prepareRestoreScreen() {
    const params = new URLSearchParams(window.location.search);
    const hasRoom = Boolean(params.get("room") || sessionStorage.getItem(CURRENT_ROOM_KEY));
    if (hasRoom) document.documentElement.classList.add("is-restoring-room");
    nativeSetTimeout(() => document.documentElement.classList.remove("is-restoring-room"), 3000);
  }

  function watchRestoredGame() {
    const gameView = document.querySelector("#gameView");
    const lobbyView = document.querySelector("#lobbyView");
    const clear = () => {
      if ((gameView && !gameView.classList.contains("hidden")) || (lobbyView && !lobbyView.classList.contains("hidden"))) {
        document.documentElement.classList.remove("is-restoring-room");
        return true;
      }
      return false;
    };
    if (clear()) return;
    const observer = new MutationObserver(() => {
      if (clear()) observer.disconnect();
    });
    if (gameView) observer.observe(gameView, { attributes: true, attributeFilter: ["class"] });
    if (lobbyView) observer.observe(lobbyView, { attributes: true, attributeFilter: ["class"] });
  }

  function addMapExpandButton() {
    const actions = document.querySelector(".board-actions");
    const boardPanel = document.querySelector(".board-panel");
    if (!actions || !boardPanel || document.querySelector("#mapExpandBtn")) return;

    const button = document.createElement("button");
    button.id = "mapExpandBtn";
    button.className = "secondary map-expand-btn";
    button.type = "button";
    button.textContent = "Ampliar mapa";
    button.title = "Ver el mapa mas grande";
    button.addEventListener("click", () => toggleMapFocus(boardPanel));
    actions.insertBefore(button, actions.firstChild);

    document.addEventListener("fullscreenchange", updateExpandButton);
    updateExpandButton();
  }

  async function toggleMapFocus(boardPanel) {
    const isFocused = document.body.classList.contains("map-focus-mode") || document.fullscreenElement;
    if (isFocused) {
      document.body.classList.remove("map-focus-mode");
      if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen();
      updateExpandButton();
      return;
    }

    document.body.classList.add("map-focus-mode");
    boardPanel.scrollIntoView({ block: "start", behavior: "smooth" });
    try {
      if (boardPanel.requestFullscreen && window.innerWidth >= 760) await boardPanel.requestFullscreen();
    } catch {
      // Algunos celulares no permiten pantalla completa en elementos HTML.
    }
    updateExpandButton();
  }

  function updateExpandButton() {
    const button = document.querySelector("#mapExpandBtn");
    if (!button) return;
    const active = document.body.classList.contains("map-focus-mode") || Boolean(document.fullscreenElement);
    button.textContent = active ? "Salir mapa" : "Ampliar mapa";
  }

  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .is-restoring-room #homeView { visibility: hidden; }
      .map-expand-btn { white-space: nowrap; }
      .board-panel:fullscreen {
        background: var(--surface);
        border: 0;
        border-radius: 0;
        height: 100vh;
        overflow: auto;
        padding: 14px;
        width: 100vw;
      }
      .board-panel:fullscreen .world-map { min-height: min(92vh, 900px); }
      body.map-focus-mode { overflow-x: hidden; }
      body.map-focus-mode .board-panel {
        box-shadow: 0 0 0 9999px rgba(5, 8, 12, 0.72);
        position: relative;
        z-index: 1200;
      }
      body.map-focus-mode .world-map { min-height: min(78vh, 820px); }
      @media (max-width: 700px) {
        .app-shell { width: min(100% - 8px, 1720px); padding-top: 10px; }
        .panel { padding: 10px; }
        h1 { font-size: 34px; }
        h2 { font-size: 22px; }
        .map-help, .attack-panel { font-size: 12px; }
        .world-map { min-height: 560px; }
        .map-country {
          height: 22px;
          min-height: 22px;
          width: 22px;
        }
        .map-country .owner-dot {
          height: 9px;
          width: 9px;
        }
        .map-country .army-count {
          font-size: 10px;
          height: 17px;
          min-width: 17px;
          padding: 0 4px;
        }
        .map-country:hover,
        .map-country:focus-visible,
        .map-country.selected-country {
          gap: 4px;
          padding: 4px 5px;
          width: clamp(70px, 28vw, 94px);
        }
        .map-country .country-name { font-size: 10px; max-width: 62px; }
        .continent-map-label {
          font-size: 10px;
          min-height: 22px;
          padding: 0 7px;
        }
        .route { stroke-width: 0.25; }
        .route.active { stroke-width: 0.55; }
        .board-actions { grid-template-columns: 1fr; }
        body.map-focus-mode .topbar,
        body.map-focus-mode .sidebar,
        body.map-focus-mode .map-help,
        body.map-focus-mode .attack-panel {
          display: none;
        }
        body.map-focus-mode .game-layout { display: block; }
        body.map-focus-mode .board-panel {
          border-radius: 0;
          margin: 0 -4px;
          min-height: 100vh;
        }
        body.map-focus-mode .world-map {
          min-height: 78vh;
          overflow: visible;
        }
      }
    `;
    document.head.appendChild(style);
  }
})();
