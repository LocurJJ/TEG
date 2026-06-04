(function () {
  const STORAGE_PREFIX = "teg2-room-";
  const LOCAL_PLAYER_KEY = "teg2-local-player";
  const CURRENT_ROOM_KEY = "teg2-current-room";
  const MAP_SIZE = 130;
  const BOARD_IMAGE_CANDIDATES = ["assets/mapa-teg.jpg", "assets/mapa.jpg", "assets/mapa.jpeg", "assets/mapa.png", "mapa-teg.jpg", "mapa.jpg", "mapa.jpeg", "mapa.png", "mapa"];
  const colors = [
    { id: "rojo", name: "Rojo", value: "#ef4444" },
    { id: "azul", name: "Azul", value: "#3b82f6" },
    { id: "verde", name: "Verde", value: "#22c55e" },
    { id: "amarillo", name: "Amarillo", value: "#facc15" },
    { id: "violeta", name: "Violeta", value: "#a855f7" },
    { id: "negro", name: "Negro", value: "#111827" }
  ];

  const continents = [
    { id: "sudamerica", name: "Sudamerica", color: "#36c2a0", countries: ["Argentina", "Brasil", "Chile", "Uruguay", "Paraguay", "Bolivia", "Colombia", "Venezuela"] },
    { id: "centroamerica", name: "Centro America", color: "#ffb703", countries: ["Jamaica", "Cuba", "El Salvador", "Honduras", "Mexico", "Nicaragua"] },
    { id: "norteamerica", name: "Norte America", color: "#4cc9f0", countries: ["Texas", "California", "Las Vegas", "Nueva Chicago", "Oregon", "Washington", "Labrador", "Canada", "New York", "Groenlandia", "Isla Victoria", "Alaska"] },
    { id: "africa", name: "Africa", color: "#f97316", countries: ["Sahara", "Mauritania", "Sudafrica", "Madagascar", "Nigeria", "Egipto", "Kongo", "Ghana"] },
    { id: "europa", name: "Europa", color: "#e879f9", countries: ["Portugal", "Espana", "Francia", "Italia", "Alemania", "Serbia", "Croacia", "Polonia", "Albania", "Ucrania", "Bielorusia", "Finlandia", "Noruega", "Islandia", "Irlanda", "Gran Bretana"] },
    { id: "asia", name: "Asia", color: "#f43f5e", countries: ["Arabia", "Israel", "Irak", "India", "Filipinas", "Vietnam", "Turquia", "Iran", "Rusia", "China", "Chechenia", "Siberia", "Kazakhstan", "Kamtchatka", "Japon", "Corea"] },
    { id: "oseania", name: "Oseania", color: "#84cc16", countries: ["Sumatra", "Australia", "Micronesia", "Islas Marshall", "Tonga", "Nueva Zelanda"] }
  ];

  const countryData = continents.flatMap((continent) => continent.countries.map((name) => ({ id: slug(name), name, continentId: continent.id })));
  const mapPositions = {
    "argentina": [26.6, 108.7], "brasil": [37.1, 89.3], "chile": [23.1, 98.1], "uruguay": [33.3, 107], "paraguay": [31.1, 97], "bolivia": [26.7, 90.4], "colombia": [27, 78], "venezuela": [34.1, 80.8],
    "jamaica": [38.8, 56.5], "cuba": [35, 50.3], "el-salvador": [29.2, 64.4], "honduras": [28.8, 58], "mexico": [23, 57], "nicaragua": [25.9, 68.7],
    "texas": [18.5, 52.2], "california": [11.9, 39.2], "las-vegas": [28, 43], "nueva-chicago": [34, 34], "oregon": [16, 33.4], "washington": [27, 26], "labrador": [39, 28], "canada": [16.7, 20.8], "new-york": [34, 18], "groenlandia": [42, 8], "isla-victoria": [29.8, 9.5], "alaska": [12.8, 6.2],
    "sahara": [62.4, 77.9], "mauritania": [82.5, 89.9], "sudafrica": [79.2, 104.9], "madagascar": [89, 99.1], "nigeria": [69.1, 85.1], "egipto": [77.8, 78.2], "kongo": [74.3, 94.8], "ghana": [65.5, 94],
    "portugal": [55.6, 58.7], "espana": [62.1, 57.7], "francia": [66, 51.9], "italia": [73.7, 54.5], "alemania": [73, 41.6], "serbia": [80.5, 43.2], "croacia": [79.4, 50.9], "polonia": [83.9, 38.7], "albania": [87.2, 48.6], "ucrania": [87.4, 27.8], "bielorusia": [82.4, 25.9], "finlandia": [76.3, 20.6], "noruega": [70, 22.1], "islandia": [58.4, 21.6], "irlanda": [57, 37], "gran-bretana": [66.8, 35.8],
    "arabia": [94.9, 73.6], "israel": [95.8, 57.2], "irak": [89.4, 62.3], "india": [103.3, 63.7], "filipinas": [113.7, 63.2], "vietnam": [106.9, 51.9], "turquia": [100.5, 51.2], "iran": [93.7, 49.2], "rusia": [94.5, 27.9], "china": [103.4, 40.6], "chechenia": [97.5, 20.6], "siberia": [95.7, 8.6], "kazakhstan": [106.6, 11.9], "kamtchatka": [107.5, 22.1], "japon": [119.3, 30], "corea": [111.2, 40.3],
    "sumatra": [100.9, 88.5], "australia": [109.5, 98.9], "micronesia": [110.7, 82.7], "islas-marshall": [122.8, 83.7], "tonga": [114.5, 115.3], "nueva-zelanda": [107.2, 122.2]
  };

  const neighbors = normalizeNeighbors({
    "alaska": ["isla-victoria", "canada", "oregon", "kamtchatka","kazajistan"], "isla-victoria": ["alaska", "groenlandia", "labrador", "canada", "oregon"], "groenlandia": ["isla-victoria", "labrador", "canada", "islandia"], "labrador": ["groenlandia", "isla-victoria", "canada", "new-york", "nueva-chicago"], "canada": ["alaska", "isla-victoria", "groenlandia", "labrador", "oregon", "washington", "nueva-chicago", "new-york"], "oregon": ["alaska", "isla-victoria", "canada", "washington", "california"], "washington": ["canada", "oregon", "nueva-chicago", "las-vegas"], "california": ["oregon", "las-vegas", "texas", "mexico"], "las-vegas": ["california", "washington", "nueva-chicago", "texas"], "nueva-chicago": ["washington", "canada", "las-vegas", "new-york", "labrador", "texas"], "new-york": ["nueva-chicago", "labrador", "canada"], "texas": ["california", "las-vegas", "nueva-chicago", "mexico"],
    "mexico": ["california", "texas", "honduras", "el-salvador"], "honduras": ["mexico", "el-salvador", "nicaragua", "cuba"], "el-salvador": ["mexico", "honduras", "nicaragua"], "nicaragua": ["honduras", "el-salvador", "colombia"], "cuba": ["honduras", "jamaica"], "jamaica": ["cuba", "venezuela", "colombia"],
    "colombia": ["nicaragua", "jamaica", "venezuela", "brasil", "bolivia"], "venezuela": ["colombia", "brasil", "jamaica"], "brasil": ["venezuela", "colombia", "bolivia", "paraguay", "uruguay", "sahara"], "bolivia": ["colombia", "brasil", "paraguay", "chile", "argentina"], "paraguay": ["bolivia", "brasil", "argentina", "uruguay"], "uruguay": ["brasil", "paraguay", "argentina"], "argentina": ["chile", "bolivia", "paraguay", "uruguay"], "chile": ["bolivia", "argentina"],
    "islandia": ["groenlandia", "irlanda", "gran-bretana", "noruega"], "irlanda": ["islandia", "gran-bretana", "francia"], "gran-bretana": ["irlanda", "islandia", "francia", "alemania"], "portugal": ["espana", "sahara"], "espana": ["portugal", "francia", "sahara"], "francia": ["espana", "gran-bretana", "alemania", "italia"], "italia": ["francia", "alemania", "croacia", "albania"], "alemania": ["francia", "gran-bretana", "italia", "polonia", "croacia"], "noruega": ["islandia", "finlandia", "polonia"], "finlandia": ["noruega", "polonia", "bielorusia", "rusia"], "polonia": ["alemania", "noruega", "finlandia", "bielorusia", "ucrania"], "bielorusia": ["finlandia", "polonia", "ucrania", "rusia"], "ucrania": ["polonia", "bielorusia", "serbia", "turquia", "chechenia"], "croacia": ["alemania", "italia", "serbia"], "serbia": ["croacia", "albania", "ucrania"], "albania": ["serbia", "italia", "turquia"],
    "sahara": ["portugal", "espana", "brasil", "mauritania", "ghana", "nigeria", "egipto"], "mauritania": ["sahara", "ghana"], "ghana": ["mauritania", "sahara", "nigeria", "kongo"], "nigeria": ["sahara", "ghana", "kongo", "egipto"], "egipto": ["sahara", "nigeria", "israel", "arabia"], "kongo": ["ghana", "nigeria", "sudafrica", "madagascar"], "sudafrica": ["kongo", "madagascar"], "madagascar": ["kongo", "sudafrica", "sumatra"],
    "turquia": ["albania", "ucrania", "israel", "irak", "iran", "chechenia"], "israel": ["egipto", "turquia", "irak", "arabia"], "arabia": ["egipto", "israel", "irak", "india"], "irak": ["israel", "arabia", "turquia", "iran"], "iran": ["irak", "turquia", "chechenia", "kazakhstan", "india"], "india": ["arabia", "iran", "china", "vietnam", "sumatra"], "rusia": ["finlandia", "bielorusia", "chechenia", "siberia", "kazakhstan"], "chechenia": ["ucrania", "turquia", "iran", "rusia", "kazakhstan"], "kazakhstan": ["rusia", "chechenia", "iran", "china", "siberia"], "siberia": ["rusia", "kazakhstan", "china", "kamtchatka"], "china": ["kazakhstan", "siberia", "india", "vietnam", "corea"], "vietnam": ["india", "china", "filipinas", "sumatra"], "filipinas": ["vietnam", "corea", "micronesia"], "corea": ["china", "japon", "filipinas", "kamtchatka"], "japon": ["corea", "kamtchatka"], "kamtchatka": ["alaska", "siberia", "corea", "japon"],
    "sumatra": ["india", "vietnam", "madagascar", "australia"], "australia": ["sumatra", "micronesia", "tonga", "nueva-zelanda"], "micronesia": ["australia", "filipinas", "islas-marshall", "tonga"], "islas-marshall": ["micronesia", "tonga"], "tonga": ["micronesia", "islas-marshall", "australia", "nueva-zelanda"], "nueva-zelanda": ["australia", "tonga"]
  });

  const els = {
    homeView: document.querySelector("#homeView"), lobbyView: document.querySelector("#lobbyView"), gameView: document.querySelector("#gameView"), createForm: document.querySelector("#createForm"), joinForm: document.querySelector("#joinForm"), hostName: document.querySelector("#hostName"), joinCode: document.querySelector("#joinCode"), joinName: document.querySelector("#joinName"), roomPill: document.querySelector("#roomPill"), lobbyTitle: document.querySelector("#lobbyTitle"), playerList: document.querySelector("#playerList"), colorGrid: document.querySelector("#colorGrid"), lobbyHint: document.querySelector("#lobbyHint"), startGameBtn: document.querySelector("#startGameBtn"), leaveLobbyBtn: document.querySelector("#leaveLobbyBtn"), gameTitle: document.querySelector("#gameTitle"), turnCard: document.querySelector("#turnCard"), gamePlayers: document.querySelector("#gamePlayers"), continentLegend: document.querySelector("#continentLegend"), mapHelp: document.querySelector("#mapHelp"), attackPanel: document.querySelector("#attackPanel"), board: document.querySelector("#board"), finishTurnBtn: document.querySelector("#finishTurnBtn"), resetBtn: document.querySelector("#resetBtn"), copyCodeBtn: document.querySelector("#copyCodeBtn")
  };

  const backend = createBackend();
  let state = null;
  let unsubscribeRoom = null;
  let selectedCountryId = null;
  let hasBoardImage = false;
  let boardImagePath = "";
  let localPlayerId = sessionStorage.getItem(LOCAL_PLAYER_KEY) || makeId("P");
  sessionStorage.setItem(LOCAL_PLAYER_KEY, localPlayerId);
  detectBoardImage();
  if (new URLSearchParams(window.location.search).has("preview")) state = previewRoom(); else restoreRoomFromUrl();

  window.addEventListener("storage", (event) => {
    if (backend.mode !== "local" || !state || event.key !== storageKey(state.code) || !event.newValue) return;
    state = JSON.parse(event.newValue);
    render();
  });

  els.createForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = cleanName(els.hostName.value) || "Anfitrion";
    const code = makeRoomCode();
    state = newRoom(code, { id: localPlayerId, name, isHost: true });
    await saveState();
    rememberRoom(code);
    subscribeToRoom(code);
    render();
  });

  els.joinForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const code = els.joinCode.value.trim().toUpperCase();
    const name = cleanName(els.joinName.value) || "Jugador";
    const loaded = await loadRoom(code);
    if (!loaded) {
      toast(backend.mode === "firebase" ? "No encontre esa partida online." : "No encontre esa partida en este navegador.");
      return;
    }
    if (loaded.players.length >= 6 && !loaded.players.some((player) => player.id === localPlayerId)) {
      toast("La partida ya tiene 6 jugadores.");
      return;
    }
    state = loaded;
    subscribeToRoom(code);
    if (state.players.some((player) => player.id === localPlayerId)) {
      localPlayerId = makeId("P");
      sessionStorage.setItem(LOCAL_PLAYER_KEY, localPlayerId);
    }
    upsertPlayer({ id: localPlayerId, name, isHost: false });
    await saveState();
    rememberRoom(code);
    render();
  });

  els.leaveLobbyBtn.addEventListener("click", () => {
    if (unsubscribeRoom) unsubscribeRoom();
    unsubscribeRoom = null;
    state = null;
    forgetRoom();
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
    if (state?.phase === "placement") {
      if (!canActNow()) return;
      const current = getCurrentPlacement();
      if (current.remaining > 0) {
        toast("Todavia te quedan fichas por colocar.");
        return;
      }
      advancePlacementTurn();
      saveState();
      render();
      return;
    }
    if (state?.phase === "attack" && isMyAttackTurn()) {
      nextAttackTurn();
      saveState();
      render();
    }
  });

  els.resetBtn.addEventListener("click", () => {
    if (!state || !isHost()) return;
    state.phase = "lobby";
    state.countries = {};
    state.placement = null;
    state.attack = null;
    selectedCountryId = null;
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
    els.lobbyHint.textContent = backend.mode === "firebase" ? "Modo online activo: los jugadores pueden unirse desde otras compus o celulares con este codigo." : "Modo local: para jugar desde distintas compus/celulares completa firebase-config.js con tu configuracion.";
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
    renderTurnCard();
    renderLegend();
    renderMapHelp();
    renderAttackPanel();
    renderBoard();
  }

  function renderTurnCard() {
    const placement = getCurrentPlacement();
    if (state.phase === "placement" && placement) {
      const player = getPlayer(placement.playerId);
      const mine = placement.playerId === localPlayerId;
      els.finishTurnBtn.textContent = "Terminar colocacion";
      els.finishTurnBtn.disabled = !canActNow() || placement.remaining !== 0;
      els.turnCard.innerHTML = `<p>Fase de colocacion <strong>${state.placement.round === 0 ? "8 fichas" : "4 fichas"}</strong></p><p>Turno de <strong>${escapeHtml(player?.name || "Jugador")}</strong></p><p>${mine ? "Te quedan" : "Le quedan"} <strong>${placement.remaining}</strong> fichas.</p>`;
      return;
    }
    if (state.phase === "attack") {
      const player = getAttackPlayer();
      const mine = player?.id === localPlayerId;
      els.finishTurnBtn.textContent = "Terminar turno";
      els.finishTurnBtn.disabled = !mine;
      const log = state.attack?.log ? `<hr><p>${state.attack.log}</p>` : "";
      els.turnCard.innerHTML = `<p>Fase de ataque</p><p>Turno de <strong>${escapeHtml(player?.name || "Jugador")}</strong></p><p>${mine ? "Podes atacar o terminar tu turno." : "Esperando al jugador."}</p>${log}`;
      return;
    }
    els.finishTurnBtn.textContent = "Terminar turno";
    els.finishTurnBtn.disabled = true;
    els.turnCard.innerHTML = "<p>La partida esta lista.</p>";
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
    els.board.className = hasBoardImage ? "board world-map with-board-image" : "board world-map";
    els.board.style.backgroundImage = boardImagePath ? `linear-gradient(rgba(10, 15, 19, 0.02), rgba(10, 15, 19, 0.03)), url("${boardImagePath}")` : "";
    renderLandMasses();
    renderRoutes();
    continents.forEach((continent) => {
      const label = document.createElement("div");
      label.className = `continent-map-label label-${continent.id}`;
      label.innerHTML = `<span class="continent-dot" style="background:${continent.color}"></span>${continent.name}`;
      els.board.appendChild(label);
    });
    countryData.forEach((country) => els.board.appendChild(countryButton(country)));
  }

  function renderRoutes() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "map-routes");
    svg.setAttribute("viewBox", "0 0 130 130");
    svg.setAttribute("preserveAspectRatio", "none");
    const drawn = new Set();
    Object.entries(neighbors).forEach(([from, targets]) => {
      targets.forEach((to) => {
        const key = [from, to].sort().join("-");
        if (drawn.has(key) || !mapPositions[from] || !mapPositions[to]) return;
        drawn.add(key);
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", mapPositions[from][0]);
        line.setAttribute("y1", mapPositions[from][1]);
        line.setAttribute("x2", mapPositions[to][0]);
        line.setAttribute("y2", mapPositions[to][1]);
        line.setAttribute("class", selectedCountryId && (from === selectedCountryId || to === selectedCountryId) ? "route active" : "route");
        svg.appendChild(line);
      });
    });
    els.board.appendChild(svg);
  }

  function renderLandMasses() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "map-land");
    svg.setAttribute("viewBox", `0 0 ${MAP_SIZE} ${MAP_SIZE}`);
    svg.setAttribute("preserveAspectRatio", "none");
    els.board.appendChild(svg);
  }

  function countryButton(country) {
    const button = document.createElement("button");
    const data = state.countries[country.id] || { ownerId: null, armies: 0 };
    const owner = getPlayer(data.ownerId);
    const color = getColor(owner?.colorId);
    const continent = continents.find((item) => item.id === country.continentId);
    const position = mapPositions[country.id] || [50, 50];
    const isSelected = selectedCountryId === country.id;
    const isNeighbor = selectedCountryId && neighbors[selectedCountryId]?.includes(country.id);
    const canAttack = canAttackFromTo(selectedCountryId, country.id);
    button.className = "country map-country";
    button.type = "button";
    button.style.left = `${toMapXPercent(position[0])}%`;
    button.style.top = `${toMapPercent(position[1])}%`;
    button.style.setProperty("--country-color", continent?.color || "#667085");
    button.innerHTML = `<span class="country-name">${escapeHtml(country.name)}</span><span class="country-meta"><span class="owner-dot" style="background:${color?.value || "#667085"}"></span><span class="army-count">${data.armies}</span></span>`;
    button.classList.toggle("owned-by-me", data.ownerId === localPlayerId);
    button.classList.toggle("selected-country", isSelected);
    button.classList.toggle("neighbor-country", Boolean(isNeighbor));
    button.classList.toggle("attack-country", Boolean(canAttack));
    button.classList.toggle("disabled-click", state.phase === "placement" && !canPlaceOn(country.id));
    button.title = owner ? `${owner.name} - ${data.armies} fichas` : country.name;
    button.addEventListener("click", () => handleCountryClick(country.id));
    return button;
  }

  function handleCountryClick(countryId) {
    if (state.phase === "placement") {
      selectedCountryId = countryId;
      if (canPlaceOn(countryId)) placeArmy(countryId); else renderGame();
      return;
    }
    if (state.phase === "attack") {
      if (selectedCountryId && canAttackFromTo(selectedCountryId, countryId)) {
        attackCountry(selectedCountryId, countryId);
        return;
      }
      selectedCountryId = countryId;
      renderGame();
    }
  }

  function renderMapHelp() {
    if (state.phase === "placement") {
      els.mapHelp.textContent = "Toca tus paises para poner fichas. Al tocar cualquier pais tambien se resaltan sus limitrofes.";
      return;
    }
    els.mapHelp.textContent = "En tu turno, toca un pais propio con mas de 1 tropa y despues toca un vecino enemigo para atacar. El defensor gana los empates.";
  }

  function renderAttackPanel() {
    if (!selectedCountryId) {
      els.attackPanel.innerHTML = "<strong>Seleccion:</strong> toca un pais del mapa para ver tropas, dueno y limitrofes.";
      return;
    }
    const country = getCountry(selectedCountryId);
    const data = getSelectedCountry();
    const owner = getPlayer(data?.ownerId);
    const adjacent = (neighbors[selectedCountryId] || []).map(getCountry).filter(Boolean);
    const attackable = adjacent.filter((item) => canAttackFromTo(selectedCountryId, item.id));
    const buttons = attackable.map((item) => `<button class="secondary attack-option" data-target="${item.id}" type="button">Atacar ${escapeHtml(item.name)}</button>`).join("");
    els.attackPanel.innerHTML = `<div><strong>${country?.name || "Pais"}</strong> - ${escapeHtml(owner?.name || "Sin dueno")} - ${data?.armies || 0} tropas</div><div><span>Limitrofes:</span> ${adjacent.map((item) => item.name).join(", ") || "sin cargar"}</div><div><span>Podrias atacar:</span> ${attackable.map((item) => item.name).join(", ") || "ninguno ahora"}</div>${buttons}`;
    els.attackPanel.querySelectorAll("[data-target]").forEach((button) => button.addEventListener("click", () => attackCountry(selectedCountryId, button.dataset.target)));
  }

  function attackCountry(fromId, toId) {
    if (!canAttackFromTo(fromId, toId)) {
      toast("Ese ataque no se puede hacer ahora.");
      return;
    }
    const from = state.countries[fromId];
    const to = state.countries[toId];
    const attackerDiceCount = Math.min(3, from.armies - 1);
    const defenderDiceCount = Math.min(3, to.armies);
    const attackerDice = rollDice(attackerDiceCount);
    const defenderDice = rollDice(defenderDiceCount);
    let attackerLosses = 0;
    let defenderLosses = 0;
    for (let index = 0; index < Math.min(attackerDice.length, defenderDice.length); index += 1) {
      if (attackerDice[index] > defenderDice[index]) defenderLosses += 1;
      else attackerLosses += 1;
    }
    from.armies -= attackerLosses;
    to.armies -= defenderLosses;
    let result = `${getCountry(fromId).name} ataco a ${getCountry(toId).name}. Dados: ${attackerDice.join("-")} vs ${defenderDice.join("-")}. Perdidas: atacante ${attackerLosses}, defensor ${defenderLosses}.`;
    if (to.armies <= 0) {
      const maxMove = Math.max(1, from.armies - 1);
      const requested = Number(window.prompt(`Conquistaste ${getCountry(toId).name}. Cuantas tropas queres mover? 1 a ${maxMove}`, String(Math.min(maxMove, attackerDiceCount))));
      const move = clampInt(Number.isFinite(requested) ? requested : 1, 1, maxMove);
      from.armies -= move;
      to.ownerId = localPlayerId;
      to.armies = move;
      result += ` Conquista: entraron ${move} tropas.`;
      selectedCountryId = toId;
    }
    state.attack.log = result;
    saveState();
    render();
  }

  function canAttackFromTo(fromId, toId) {
    if (!fromId || !toId || fromId === toId || state?.phase !== "attack" || !isMyAttackTurn()) return false;
    const from = state.countries[fromId];
    const to = state.countries[toId];
    return Boolean(from?.ownerId === localPlayerId && to?.ownerId && to.ownerId !== localPlayerId && from.armies > 1 && neighbors[fromId]?.includes(toId));
  }

  function nextAttackTurn() {
    if (!state.attack) state.attack = { turnIndex: 0, log: null };
    selectedCountryId = null;
    state.attack.turnIndex = (state.attack.turnIndex + 1) % state.players.length;
    state.attack.log = null;
  }

  function rollDice(amount) {
    return Array.from({ length: amount }, () => 1 + Math.floor(Math.random() * 6)).sort((a, b) => b - a);
  }

  function playerRow(player) {
    const color = getColor(player.colorId);
    const row = document.createElement("div");
    row.className = "player-row";
    row.classList.toggle("current", player.id === localPlayerId);
    row.innerHTML = `<span class="player-color" style="background:${color?.value || "#667085"}"></span><strong>${escapeHtml(player.name)}</strong><span class="player-status">${player.isHost ? "Creador" : "Jugador"}</span>`;
    return row;
  }

  function chooseColor(colorId) {
    const owner = state.players.find((player) => player.colorId === colorId);
    if (owner && owner.id !== localPlayerId) return;
    state.players = state.players.map((player) => player.id === localPlayerId ? { ...player, colorId } : player);
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
    state.placement = { round: 0, turnIndex: 0, turns: players.map((player) => ({ playerId: player.id, remaining: 8 })) };
    state.attack = null;
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
    state.phase = "attack";
    state.placement = null;
    state.attack = { turnIndex: 0, log: null };
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

  function isMyAttackTurn() {
    return Boolean(state?.phase === "attack" && getAttackPlayer()?.id === localPlayerId);
  }

  function getAttackPlayer() {
    if (!state?.attack) return null;
    return state.players[state.attack.turnIndex] || null;
  }

  function getCurrentPlacement() { return state?.placement ? state.placement.turns[state.placement.turnIndex] || null : null; }
  function newRoom(code, host) { return { code, phase: "lobby", createdAt: Date.now(), players: [{ ...host, colorId: null }], countries: {}, placement: null, attack: null }; }
  function previewRoom() {
    const previewPlayers = [{ id: localPlayerId, name: "Prueba 1", isHost: true, colorId: "rojo" }, { id: "preview-2", name: "Prueba 2", isHost: false, colorId: "azul" }];
    const countries = {};
    countryData.forEach((country, index) => { countries[country.id] = { ownerId: previewPlayers[index % previewPlayers.length].id, armies: index % 7 === 0 ? 4 : 2 }; });
    return { code: "MAPA", phase: "attack", createdAt: Date.now(), players: previewPlayers, countries, placement: null, attack: { turnIndex: 0, log: null } };
  }
  function upsertPlayer(player) { const existing = state.players.find((item) => item.id === player.id); if (existing) { state.players = state.players.map((item) => item.id === player.id ? { ...item, name: player.name } : item); return; } state.players.push({ ...player, colorId: null }); }
  async function saveState() { await backend.saveRoom(state); }
  async function loadRoom(code) { return backend.loadRoom(code); }
  async function restoreRoomFromUrl() { const params = new URLSearchParams(window.location.search); const code = (params.get("room") || sessionStorage.getItem(CURRENT_ROOM_KEY) || "").trim().toUpperCase(); if (!code) return; const loaded = await loadRoom(code); if (!loaded) { sessionStorage.removeItem(CURRENT_ROOM_KEY); return; } state = loaded; if (state.phase === "ready") state.phase = "attack"; if (state.phase === "attack" && !state.attack) state.attack = { turnIndex: 0, log: null }; rememberRoom(code, false); subscribeToRoom(code); render(); }
  function subscribeToRoom(code) { if (unsubscribeRoom) unsubscribeRoom(); unsubscribeRoom = backend.subscribeRoom(code, (room) => { if (!room) { state = null; render(); return; } state = room; if (state.phase === "ready") state.phase = "attack"; if (state.phase === "attack" && !state.attack) state.attack = { turnIndex: 0, log: null }; render(); }); }
  function storageKey(code) { return `${STORAGE_PREFIX}${code}`; }
  function rememberRoom(code, updateUrl = true) { sessionStorage.setItem(CURRENT_ROOM_KEY, code); if (!updateUrl) return; const params = new URLSearchParams(window.location.search); params.delete("preview"); params.delete("calibrar"); params.set("room", code); params.set("v", Date.now().toString(36)); window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`); }
  function forgetRoom() { sessionStorage.removeItem(CURRENT_ROOM_KEY); const params = new URLSearchParams(window.location.search); params.delete("room"); params.delete("calibrar"); window.history.replaceState(null, "", params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname); }
  function isHost() { return Boolean(getMe()?.isHost); }
  function getMe() { return state?.players.find((player) => player.id === localPlayerId); }
  function getPlayer(id) { return state?.players.find((player) => player.id === id); }
  function getCountry(id) { return countryData.find((country) => country.id === id); }
  function getSelectedCountry() { return selectedCountryId ? state?.countries[selectedCountryId] : null; }
  function getColor(id) { return colors.find((color) => color.id === id); }
  function toMapPercent(value) { return (value / MAP_SIZE) * 100; }
  function toMapXPercent(value) { if (!hasBoardImage) return toMapPercent(value); const horizontalImagePadding = 8; return horizontalImagePadding + (value / MAP_SIZE) * (100 - horizontalImagePadding * 2); }
  function makeRoomCode() { let code = ""; do { code = Math.random().toString(36).slice(2, 8).toUpperCase(); } while (backend.mode === "local" && localStorage.getItem(storageKey(code))); return code; }
  function createBackend() { const config = window.TEG_FIREBASE_CONFIG; const canUseFirebase = Boolean(config?.apiKey && config?.databaseURL && window.firebase?.database); if (canUseFirebase) { if (!firebase.apps.length) firebase.initializeApp(config); const db = firebase.database(); return { mode: "firebase", async saveRoom(room) { await db.ref(`rooms/${room.code}`).set(room); }, async loadRoom(code) { const snapshot = await db.ref(`rooms/${code}`).get(); return snapshot.exists() ? snapshot.val() : null; }, subscribeRoom(code, callback) { const ref = db.ref(`rooms/${code}`); ref.on("value", (snapshot) => callback(snapshot.exists() ? snapshot.val() : null)); return () => ref.off(); } }; } return { mode: "local", async saveRoom(room) { localStorage.setItem(storageKey(room.code), JSON.stringify(room)); }, async loadRoom(code) { const raw = localStorage.getItem(storageKey(code)); return raw ? JSON.parse(raw) : null; }, subscribeRoom() { return () => {}; } }; }
  function detectBoardImage(index = 0) { if (index >= BOARD_IMAGE_CANDIDATES.length) return; const image = new Image(); image.onload = () => { hasBoardImage = true; boardImagePath = BOARD_IMAGE_CANDIDATES[index]; if (state?.phase !== "lobby") renderGame(); }; image.onerror = () => detectBoardImage(index + 1); image.src = BOARD_IMAGE_CANDIDATES[index]; }
  function normalizeNeighbors(map) { const normalized = {}; Object.entries(map).forEach(([countryId, countryNeighbors]) => { if (!normalized[countryId]) normalized[countryId] = []; countryNeighbors.forEach((neighborId) => { if (!normalized[countryId].includes(neighborId)) normalized[countryId].push(neighborId); if (!normalized[neighborId]) normalized[neighborId] = []; if (!normalized[neighborId].includes(countryId)) normalized[neighborId].push(countryId); }); }); return normalized; }
  function makeId(prefix) { return `${prefix}-${Math.random().toString(36).slice(2)}-${Date.now()}`; }
  function shuffle(items) { const copy = [...items]; for (let index = copy.length - 1; index > 0; index -= 1) { const swapIndex = Math.floor(Math.random() * (index + 1)); [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]; } return copy; }
  function slug(value) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
  function cleanName(value) { return value.trim().replace(/\s+/g, " ").slice(0, 18); }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]); }
  function clampInt(value, min, max) { return Math.min(Math.max(Math.trunc(value), min), max); }
  function toast(message) { const node = document.createElement("div"); node.className = "toast"; node.textContent = message; document.body.appendChild(node); window.setTimeout(() => node.remove(), 2200); }
  render();
})();
