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
    button.textContent = "Modo mapa";
    button.title = "Abrir el mapa grande";
    button.addEventListener("click", () => toggleMapFocus(boardPanel));
    actions.insertBefore(button, actions.firstChild);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && document.body.classList.contains("map-focus-mode")) toggleMapFocus(boardPanel);
    });
    updateExpandButton();
  }

  function toggleMapFocus(boardPanel) {
    const isFocused = document.body.classList.contains("map-focus-mode");
    document.body.classList.toggle("map-focus-mode", !isFocused);
    if (!isFocused) nativeSetTimeout(() => boardPanel.scrollIntoView({ block: "start" }), 30);
    updateExpandButton();
  }

  function updateExpandButton() {
    const button = document.querySelector("#mapExpandBtn");
    if (!button) return;
    const active = document.body.classList.contains("map-focus-mode");
    button.textContent = active ? "Cerrar mapa" : "Modo mapa";
    button.title = active ? "Volver a la partida" : "Abrir el mapa grande";
  }

  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .is-restoring-room #homeView { visibility: hidden; }
      .map-expand-btn { white-space: nowrap; }
      @media (hover: none), (max-width: 900px) {
        .map-country {
          height: 18px;
          min-height: 18px;
          padding: 0;
          width: 18px;
        }
        .map-country .country-meta { gap: 1px; }
        .map-country .owner-dot {
          height: 7px;
          width: 7px;
        }
        .map-country .army-count {
          border-width: 1px;
          font-size: 9px;
          height: 14px;
          min-width: 14px;
          padding: 0 3px;
        }
        .map-country:hover,
        .map-country:focus-visible,
        .map-country.selected-country {
          border-radius: 8px;
          gap: 4px;
          padding: 3px 5px;
          width: clamp(64px, 25vw, 88px);
        }
        .map-country .country-name {
          font-size: 10px;
          max-width: 54px;
        }
        .continent-map-label {
          font-size: 9px;
          min-height: 20px;
          padding: 0 6px;
        }
      }
      @media (max-width: 700px) {
        .app-shell { width: min(100% - 8px, 1720px); padding-top: 10px; }
        .panel { padding: 10px; }
        h1 { font-size: 34px; }
        h2 { font-size: 22px; }
        .map-help, .attack-panel { font-size: 12px; }
        .world-map { min-height: 540px; }
        .route { stroke-width: 0.22; }
        .route.active { stroke-width: 0.5; }
        .board-actions { grid-template-columns: 1fr; }
      }
      body.map-focus-mode {
        overflow: hidden;
      }
      body.map-focus-mode .board-panel {
        background: #0f141a;
        border: 0;
        border-radius: 0;
        bottom: 0;
        box-shadow: none;
        display: grid;
        grid-template-rows: auto auto 1fr;
        left: 0;
        margin: 0;
        overflow: auto;
        padding: 12px;
        position: fixed;
        right: 0;
        top: 0;
        z-index: 4200;
      }
      body.map-focus-mode .board-panel > .section-head {
        align-items: center;
        background: rgba(15, 20, 26, 0.96);
        border-bottom: 1px solid var(--line);
        display: flex;
        flex-direction: row;
        gap: 10px;
        margin: -12px -12px 10px;
        padding: 10px 12px;
        position: sticky;
        top: -12px;
        z-index: 5;
      }
      body.map-focus-mode .board-panel > .section-head .eyebrow,
      body.map-focus-mode .map-help,
      body.map-focus-mode .attack-panel {
        display: none;
      }
      body.map-focus-mode .board-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: flex-end;
      }
      body.map-focus-mode .board-actions button {
        min-height: 38px;
      }
      body.map-focus-mode .board {
        margin-top: 0;
        overflow: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
      }
      body.map-focus-mode .world-map {
        min-height: min(86vh, 920px);
      }
      @media (max-width: 700px) {
        body.map-focus-mode .board-panel {
          grid-template-rows: auto 1fr;
          padding: 8px;
        }
        body.map-focus-mode .board-panel > .section-head {
          margin: -8px -8px 8px;
          padding: 8px;
        }
        body.map-focus-mode .board-panel h2 {
          font-size: 18px;
          white-space: nowrap;
        }
        body.map-focus-mode .board-actions button:not(#mapExpandBtn) {
          display: none;
        }
        body.map-focus-mode .world-map {
          min-height: 720px;
          min-width: 1120px;
          width: 1120px;
        }
        body.map-focus-mode .map-country {
          height: 16px;
          min-height: 16px;
          width: 16px;
        }
        body.map-focus-mode .map-country .owner-dot {
          height: 6px;
          width: 6px;
        }
        body.map-focus-mode .map-country .army-count {
          font-size: 8px;
          height: 13px;
          min-width: 13px;
          padding: 0 2px;
        }
        body.map-focus-mode .map-country:hover,
        body.map-focus-mode .map-country:focus-visible,
        body.map-focus-mode .map-country.selected-country {
          width: 76px;
        }
      }
    `;
    document.head.appendChild(style);
  }
})();
