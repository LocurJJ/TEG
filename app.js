(function () {
  const STORAGE_PREFIX = "teg2-room-";
  const LOCAL_PLAYER_KEY = "teg2-local-player";
  const colors = [
    { id: "rojo", name: "Rojo", value: "#ef4444" },
    { id: "azul", name: "Azul", value: "#3b82f6" },
    { id: "verde", name: "Verde", value: "#22c55e" },
    { id: "amarillo", name: "Amarillo", value: "#facc15" },
    { id: "violeta", name: "Violeta", value: "#a855f7" },
    { id: "negro", name: "Negro", value: "#111827" }
  ];

  const continents = [
    {
      id: "sudamerica",
      name: "Sudamerica",
      color: "#36c2a0",
      countries: ["Argentina", "Brasil", "Chile", "Uruguay", "Paraguay", "Bolivia", "Colombia", "Venezuela"]
    },
    {
      id: "centroamerica",
      name: "Centro America",
      color: "#ffb703",
      countries: ["Jamaica", "Cuba", "El Salvador", "Honduras", "Mexico", "Nicaragua"]
    },
    {
      id: "norteamerica",
      name: "Norte America",
      color: "#4cc9f0",
      countries: ["Alaska", "Groenlandia", "Labrador", "Isla Victoria", "Oregon", "New York", "Nueva Chicago", "California", "Las Vegas", "Washington", "Texas", "Florida"]
    },
    {
      id: "africa",
      name: "Africa",
      color: "#f97316",
      countries: ["Sahara", "Mauritania", "Sudafrica", "Madagascar", "Nigeria", "Egipto", "Kongo", "Ghana"]
    },
    {
      id: "europa",
      name: "Europa",
      color: "#e879f9",
      countries: ["Portugal", "Espana", "Francia", "Alemania", "Polonia", "Ucrania", "Croacia", "Gran Bretana", "Finlandia", "Islandia", "Albania", "Belgica", "Irlanda", "Bielorusia", "Italia", "Noruega"]
    },
    {
      id: "asia",
      name: "Asia",
      color: "#f43f5e",
      countries: ["Siberia", "Rusia", "Irak", "Iran", "Israel", "Arabia", "Turquia", "Corea", "Vietnam", "China", "Japon", "India", "Kazakhstan", "Siria", "Filipinas", "Indonesia"]
    },
    {
      id: "oseania",
      name: "Oseania",
      color: "#84cc16",
      countries: ["Australia", "Nueva Zelanda", "Islas Salomon", "Tonga", "Micronesia", "Islas Marshall"]
    }
  ];

  const countryData = continents.flatMap((continent) =>
    continent.countries.map((name) => ({
      id: slug(name),
      name,
      continentId: continent.id
    }))
  );

  const els = {
    homeView: document.querySelector("#homeView"),
    lobbyView: document.querySelector("#lobbyView"),
    gameView: document.querySelector("#gameView"),
    createForm: document.querySelector("#createForm"),
    joinForm: document.querySelector("#joinForm"),
    hostName: document.querySelector("#hostName"),
    joinCode: document.querySelector("#joinCode"),
    joinName: document.querySelector("#joinName"),
    roomPill: document.querySelector("#roomPill"),
    lobbyTitle: document.querySelector("#lobbyTitle"),
    playerList: document.querySelector("#playerList"),
    colorGrid: document.querySelector("#colorGrid"),
    lobbyHint: document.querySelector("#lobbyHint"),
    startGameBtn: document.querySelector("#startGameBtn"),
    leaveLobbyBtn: document.querySelector("#leaveLobbyBtn"),
    gameTitle: document.querySelector("#gameTitle"),
    turnCard: document.querySelector("#turnCard"),
    gamePlayers: document.querySelector("#gamePlayers"),
    continentLegend: document.querySelector("#continentLegend"),
    board: document.querySelector("#board"),
    finishTurnBtn: document.querySelector("#finishTurnBtn"),
    resetBtn: document.querySelector("#resetBtn"),
    copyCodeBtn: document.querySelector("#copyCodeBtn"),
    countryTemplate: document.querySelector("#countryTemplate")
  };

  let state = null;
  let localPlayerId = localStorage.getItem(LOCAL_PLAYER_KEY) || makeId("P");
  localStorage.setItem(LOCAL_PLAYER_KEY, localPlayerId);

  window.addEventListener("storage", (event) => {
    if (!state || event.key !== storageKey(state.code) || !event.newValue) return;
    state = JSON.parse(event.newValue);
    render();
  });

  els.createForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = cleanName(els.hostName.value) || "Anfitrion";
    const code = makeRoomCode();
    state = newRoom(code, { id: localPlayerId, name, isHost: true });
    saveState();
    render();
  });

  els.joinForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const code = els.joinCode.value.trim().toUpperCase();
    const name = cleanName(els.joinName.value) || "Jugador";
    const loaded = loadRoom(code);
    if (!loaded) {
      toast("No encontre esa partida en este navegador.");
      return;
    }
    if (loaded.players.length >= 6 && !loaded.players.some((player) => player.id === localPlayerId)) {
      toast("La partida ya tiene 6 jugadores.");
      return;
    }
    state = loaded;
    upsertPlayer({ id: localPlayerId, name, isHost: false });
    saveState();
    render();
  });

  els.leaveLobbyBtn.addEventListener("click", () => {
    state = null;
    render();
  });

  els.startGameBtn.addEventListener("click", () => {
    if (!state || !isHost()) return;
    const readyPlayers = state.players.filter((player) => player.colorId);
    if (readyPlayers.length < 2) {
      toast("Necesitan ser al menos 2 jugadores con color.");
      return;
    }
    startGame();
    saveState();
    render();
  });

  els.finishTurnBtn.addEventListener("click", () => {
    if (!canActNow()) return;
    const current = getCurrentPlacement();
    if (current.remaining > 0) {
      toast("Todavia te quedan fichas por colocar.");
      return;
    }
    advancePlacementTurn();
    saveState();
    render();
  });

  els.resetBtn.addEventListener("click", () => {
    if (!state || !isHost()) return;
    state.phase = "lobby";
    state.countries = {};
    state.placement = null;
    saveState();
    render();
  });

  els.copyCodeBtn.addEventListener("click", async () => {
    if (!state) return;
    try {
      await navigator.clipboard.writeText(state.code);
      toast("Codigo copiado.");
    } catch {
      toast(state.code);
    }
  });

  function render() {
    els.homeView.classList.toggle("hidden", Boolean(state));
    els.lobbyView.classList.toggle("hidden", !state || state.phase !== "lobby");
    els.gameView.classList.toggle("hidden", !state || state.phase === "lobby");
    els.roomPill.textContent = state ? `Codigo ${state.code}` : "Sin partida";

    if (!state) return;
    if (state.phase === "lobby") renderLobby();
    if (state.phase !== "lobby") renderGame();
  }

  function renderLobby() {
    els.lobbyTitle.textContent = `Partida ${state.code}`;
    els.playerList.innerHTML = "";
    state.players.forEach((player) => els.playerList.appendChild(playerRow(player)));
    renderColorGrid();
    const allReady = state.players.length >= 2 && state.players.every((player) => player.colorId);
    els.startGameBtn.disabled = !isHost() || !allReady;
    els.startGameBtn.textContent = isHost() ? "Repartir paises y empezar" : "Esperando al creador";
    els.lobbyHint.textContent = "Este prototipo sincroniza entre pestanas del mismo navegador. Para jugar desde distintas compus/celulares hay que conectarle una base realtime.";
  }

  function renderColorGrid() {
    els.colorGrid.innerHTML = "";
    colors.forEach((color) => {
      const owner = state.players.find((player) => player.colorId === color.id);
      const button = document.createElement("button");
      button.className = "color-choice";
      button.type = "button";
      button.disabled = Boolean(owner && owner.id !== localPlayerId);
      button.classList.toggle("selected", getMe()?.colorId === color.id);
      button.innerHTML = `<span class="player-color" style="background:${color.value}"></span><span>${color.name}</span>`;
      button.addEventListener("click", () => chooseColor(color.id));
      els.colorGrid.appendChild(button);
    });
  }

  function renderGame() {
    els.gameTitle.textContent = state.code;
    els.gamePlayers.innerHTML = "";
    state.players.forEach((player) => els.gamePlayers.appendChild(playerRow(player)));
    els.finishTurnBtn.disabled = !canActNow() || getCurrentPlacement()?.remaining !== 0;
    els.resetBtn.disabled = !isHost();

    const placement = getCurrentPlacement();
    if (state.phase === "placement" && placement) {
      const player = getPlayer(placement.playerId);
      const mine = placement.playerId === localPlayerId;
      els.turnCard.innerHTML = `
        <p>Fase de colocacion <strong>${state.placement.round === 0 ? "8 fichas" : "4 fichas"}</strong></p>
        <p>Turno de <strong>${player?.name || "Jugador"}</strong></p>
        <p>${mine ? "Te quedan" : "Le quedan"} <strong>${placement.remaining}</strong> fichas.</p>
      `;
    } else {
      els.turnCard.innerHTML = "<p>La colocacion inicial termino. El proximo paso es agregar ataques limitrofes y objetivos.</p>";
    }

    renderLegend();
    renderBoard();
  }

  function renderLegend() {
    els.continentLegend.innerHTML = "";
    continents.forEach((continent) => {
      const row = document.createElement("div");
      row.className = "legend-row";
      row.innerHTML = `<span class="continent-dot" style="background:${continent.color}"></span>${continent.name} (${continent.countries.length})`;
      els.continentLegend.appendChild(row);
    });
  }

  function renderBoard() {
    els.board.innerHTML = "";
    continents.forEach((continent) => {
      const group = document.createElement("section");
      group.className = "continent";
      group.innerHTML = `
        <div class="continent-title">
          <span class="continent-dot" style="background:${continent.color}"></span>
          <h3>${continent.name}</h3>
        </div>
        <div class="continent-countries"></div>
      `;
      const list = group.querySelector(".continent-countries");
      continent.countries.forEach((countryName) => {
        const country = countryData.find((item) => item.name === countryName);
        list.appendChild(countryButton(country));
      });
      els.board.appendChild(group);
    });
  }

  function countryButton(country) {
    const button = els.countryTemplate.content.firstElementChild.cloneNode(true);
    const data = state.countries[country.id];
    const owner = getPlayer(data.ownerId);
    const color = getColor(owner?.colorId);
    button.querySelector(".country-name").textContent = country.name;
    button.querySelector(".owner-dot").style.background = color?.value || "#667085";
    button.querySelector(".army-count").textContent = data.armies;
    button.classList.toggle("owned-by-me", data.ownerId === localPlayerId);
    button.classList.toggle("disabled-click", !canPlaceOn(country.id));
    button.title = owner ? `${owner.name} - ${data.armies} fichas` : country.name;
    button.addEventListener("click", () => placeArmy(country.id));
    return button;
  }

  function playerRow(player) {
    const color = getColor(player.colorId);
    const row = document.createElement("div");
    row.className = "player-row";
    row.classList.toggle("current", player.id === localPlayerId);
    row.innerHTML = `
      <span class="player-color" style="background:${color?.value || "#667085"}"></span>
      <strong>${escapeHtml(player.name)}</strong>
      <span class="player-status">${player.isHost ? "Creador" : "Jugador"}</span>
    `;
    return row;
  }

  function chooseColor(colorId) {
    const owner = state.players.find((player) => player.colorId === colorId);
    if (owner && owner.id !== localPlayerId) return;
    state.players = state.players.map((player) =>
      player.id === localPlayerId ? { ...player, colorId } : player
    );
    saveState();
    render();
  }

  function startGame() {
    const players = shuffle(state.players.filter((player) => player.colorId));
    const shuffledCountries = shuffle(countryData);
    const countries = {};
    shuffledCountries.forEach((country, index) => {
      const owner = players[index % players.length];
      countries[country.id] = { ownerId: owner.id, armies: 1 };
    });
    state.players = players;
    state.countries = countries;
    state.phase = "placement";
    state.placement = {
      round: 0,
      turnIndex: 0,
      turns: players.map((player) => ({ playerId: player.id, remaining: 8 }))
    };
  }

  function placeArmy(countryId) {
    if (!canPlaceOn(countryId)) return;
    const current = getCurrentPlacement();
    state.countries[countryId].armies += 1;
    current.remaining -= 1;
    saveState();
    render();
  }

  function advancePlacementTurn() {
    state.placement.turnIndex += 1;
    if (state.placement.turnIndex < state.placement.turns.length) return;
    if (state.placement.round === 0) {
      state.placement.round = 1;
      state.placement.turnIndex = 0;
      state.placement.turns = state.players.map((player) => ({ playerId: player.id, remaining: 4 }));
      return;
    }
    state.phase = "ready";
    state.placement = null;
  }

  function canPlaceOn(countryId) {
    if (!canActNow()) return false;
    const current = getCurrentPlacement();
    return current.remaining > 0 && state.countries[countryId]?.ownerId === localPlayerId;
  }

  function canActNow() {
    const current = getCurrentPlacement();
    return Boolean(state?.phase === "placement" && current?.playerId === localPlayerId);
  }

  function getCurrentPlacement() {
    if (!state?.placement) return null;
    return state.placement.turns[state.placement.turnIndex] || null;
  }

  function newRoom(code, host) {
    return {
      code,
      phase: "lobby",
      createdAt: Date.now(),
      players: [{ ...host, colorId: null }],
      countries: {},
      placement: null
    };
  }

  function upsertPlayer(player) {
    const existing = state.players.find((item) => item.id === player.id);
    if (existing) {
      state.players = state.players.map((item) => item.id === player.id ? { ...item, name: player.name } : item);
      return;
    }
    state.players.push({ ...player, colorId: null });
  }

  function saveState() {
    localStorage.setItem(storageKey(state.code), JSON.stringify(state));
  }

  function loadRoom(code) {
    const raw = localStorage.getItem(storageKey(code));
    return raw ? JSON.parse(raw) : null;
  }

  function storageKey(code) {
    return `${STORAGE_PREFIX}${code}`;
  }

  function isHost() {
    return Boolean(getMe()?.isHost);
  }

  function getMe() {
    return state?.players.find((player) => player.id === localPlayerId);
  }

  function getPlayer(id) {
    return state?.players.find((player) => player.id === id);
  }

  function getColor(id) {
    return colors.find((color) => color.id === id);
  }

  function makeRoomCode() {
    let code = "";
    do {
      code = Math.random().toString(36).slice(2, 8).toUpperCase();
    } while (localStorage.getItem(storageKey(code)));
    return code;
  }

  function makeId(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  }

  function shuffle(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  function slug(value) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function cleanName(value) {
    return value.trim().replace(/\s+/g, " ").slice(0, 18);
  }

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function toast(message) {
    const node = document.createElement("div");
    node.className = "toast";
    node.textContent = message;
    document.body.appendChild(node);
    window.setTimeout(() => node.remove(), 2200);
  }

  render();
})();
