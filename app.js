(function () {
  const STORAGE_PREFIX = "teg2-room-";
  const LOCAL_PLAYER_KEY = "teg2-local-player";
  const MAP_SIZE = 130;
  const BOARD_IMAGE_CANDIDATES = [
    "assets/mapa-teg.jpg",
    "assets/mapa.jpg",
    "assets/mapa.jpeg",
    "assets/mapa.png",
    "mapa-teg.jpg",
    "mapa.jpg",
    "mapa.jpeg",
    "mapa.png",
    "mapa"
  ];
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
      countries: ["Texas", "California", "Las Vegas", "Nueva Chicago", "Oregon", "Washington", "Labrador", "Canada", "New York", "Groenlandia", "Isla Victoria", "Alaska"]
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
      countries: ["Portugal", "Espana", "Francia", "Italia", "Alemania", "Serbia", "Croacia", "Polonia", "Albania", "Ucrania", "Bielorusia", "Finlandia", "Noruega", "Islandia", "Irlanda", "Gran Bretana"]
    },
    {
      id: "asia",
      name: "Asia",
      color: "#f43f5e",
      countries: ["Arabia", "Israel", "Irak", "India", "Filipinas", "Vietnam", "Turquia", "Iran", "Rusia", "China", "Chechenia", "Siberia", "Kazakhstan", "Kamtchatka", "Japon", "Corea"]
    },
    {
      id: "oseania",
      name: "Oseania",
      color: "#84cc16",
      countries: ["Sumatra", "Australia", "Micronesia", "Islas Marshall", "Tonga", "Nueva Zelanda"]
    }
  ];

  const countryData = continents.flatMap((continent) =>
    continent.countries.map((name) => ({
      id: slug(name),
      name,
      continentId: continent.id
    }))
  );

  const mapPositions = {
    // Norte America
    "alaska": [13, 26], "isla-victoria": [18, 28], "groenlandia": [31, 18], "labrador": [29, 36],
    "canada": [23, 37],
    "oregon": [14, 44], "washington": [20, 48], "california": [13, 56], "las-vegas": [19, 58],
    "nueva-chicago": [25, 55], "new-york": [31, 53], "texas": [23, 66],
    // Centro America
    "mexico": [28, 75], "honduras": [34, 78], "el-salvador": [31, 81], "nicaragua": [36, 83],
    "cuba": [39, 73], "jamaica": [43, 79],
    // Sudamerica
    "colombia": [43, 88], "venezuela": [49, 86], "brasil": [55, 96], "bolivia": [48, 101],
    "paraguay": [52, 107], "uruguay": [56, 116], "argentina": [49, 119], "chile": [43, 116],
    // Europa
    "islandia": [47, 24], "irlanda": [48, 38], "gran-bretana": [53, 37], "portugal": [52, 52],
    "espana": [56, 52], "francia": [59, 45], "italia": [63, 52], "alemania": [63, 40],
    "noruega": [61, 28], "finlandia": [68, 29], "polonia": [68, 41], "bielorusia": [72, 39],
    "ucrania": [73, 48], "croacia": [66, 49], "serbia": [69, 53], "albania": [68, 59],
    // Africa
    "sahara": [59, 72], "mauritania": [54, 78], "ghana": [58, 88], "nigeria": [64, 86],
    "egipto": [70, 73], "kongo": [67, 96], "sudafrica": [66, 117], "madagascar": [74, 111],
    // Asia
    "turquia": [76, 61], "israel": [76, 72], "arabia": [80, 80], "irak": [82, 66],
    "iran": [87, 65], "india": [93, 84], "rusia": [85, 36], "chechenia": [87, 48],
    "kazakhstan": [94, 43], "siberia": [103, 35], "china": [103, 64], "vietnam": [108, 78],
    "filipinas": [116, 84], "corea": [114, 55], "japon": [121, 56], "kamtchatka": [118, 36],
    // Oseania
    "sumatra": [101, 100], "australia": [110, 112], "micronesia": [119, 98],
    "islas-marshall": [126, 96], "tonga": [127, 116], "nueva-zelanda": [119, 124]
  };

  const neighbors = normalizeNeighbors({
    "alaska": ["isla-victoria", "canada", "oregon", "kamtchatka"],
    "isla-victoria": ["alaska", "groenlandia", "labrador", "canada", "oregon"],
    "groenlandia": ["isla-victoria", "labrador", "canada", "islandia"],
    "labrador": ["groenlandia", "isla-victoria", "canada", "new-york", "nueva-chicago"],
    "canada": ["alaska", "isla-victoria", "groenlandia", "labrador", "oregon", "washington", "nueva-chicago", "new-york"],
    "oregon": ["alaska", "isla-victoria", "canada", "washington", "california"],
    "washington": ["canada", "oregon", "nueva-chicago", "las-vegas"],
    "california": ["oregon", "las-vegas", "texas", "mexico"],
    "las-vegas": ["california", "washington", "nueva-chicago", "texas"],
    "nueva-chicago": ["washington", "canada", "las-vegas", "new-york", "labrador", "texas"],
    "new-york": ["nueva-chicago", "labrador", "canada"],
    "texas": ["california", "las-vegas", "nueva-chicago", "mexico"],
    "mexico": ["california", "texas", "honduras", "el-salvador"],
    "honduras": ["mexico", "el-salvador", "nicaragua", "cuba"],
    "el-salvador": ["mexico", "honduras", "nicaragua"],
    "nicaragua": ["honduras", "el-salvador", "colombia"],
    "cuba": ["honduras", "jamaica"],
    "jamaica": ["cuba", "venezuela", "colombia"],
    "colombia": ["nicaragua", "jamaica", "venezuela", "brasil", "bolivia"],
    "venezuela": ["colombia", "brasil", "jamaica"],
    "brasil": ["venezuela", "colombia", "bolivia", "paraguay", "uruguay", "sahara"],
    "bolivia": ["colombia", "brasil", "paraguay", "chile", "argentina"],
    "paraguay": ["bolivia", "brasil", "argentina", "uruguay"],
    "uruguay": ["brasil", "paraguay", "argentina"],
    "argentina": ["chile", "bolivia", "paraguay", "uruguay"],
    "chile": ["bolivia", "argentina"],
    "islandia": ["groenlandia", "irlanda", "gran-bretana", "noruega"],
    "irlanda": ["islandia", "gran-bretana", "francia"],
    "gran-bretana": ["irlanda", "islandia", "francia", "alemania"],
    "portugal": ["espana", "sahara"],
    "espana": ["portugal", "francia", "sahara"],
    "francia": ["espana", "gran-bretana", "alemania", "italia"],
    "italia": ["francia", "alemania", "croacia", "albania"],
    "alemania": ["francia", "gran-bretana", "italia", "polonia", "croacia"],
    "noruega": ["islandia", "finlandia", "polonia"],
    "finlandia": ["noruega", "polonia", "bielorusia", "rusia"],
    "polonia": ["alemania", "noruega", "finlandia", "bielorusia", "ucrania"],
    "bielorusia": ["finlandia", "polonia", "ucrania", "rusia"],
    "ucrania": ["polonia", "bielorusia", "serbia", "turquia", "chechenia"],
    "croacia": ["alemania", "italia", "serbia"],
    "serbia": ["croacia", "albania", "ucrania"],
    "albania": ["serbia", "italia", "turquia"],
    "sahara": ["portugal", "espana", "brasil", "mauritania", "ghana", "nigeria", "egipto"],
    "mauritania": ["sahara", "ghana"],
    "ghana": ["mauritania", "sahara", "nigeria", "kongo"],
    "nigeria": ["sahara", "ghana", "kongo", "egipto"],
    "egipto": ["sahara", "nigeria", "israel", "arabia"],
    "kongo": ["ghana", "nigeria", "sudafrica", "madagascar"],
    "sudafrica": ["kongo", "madagascar"],
    "madagascar": ["kongo", "sudafrica", "sumatra"],
    "turquia": ["albania", "ucrania", "israel", "irak", "iran", "chechenia"],
    "israel": ["egipto", "turquia", "irak", "arabia"],
    "arabia": ["egipto", "israel", "irak", "india"],
    "irak": ["israel", "arabia", "turquia", "iran"],
    "iran": ["irak", "turquia", "chechenia", "kazakhstan", "india"],
    "india": ["arabia", "iran", "china", "vietnam", "sumatra"],
    "rusia": ["finlandia", "bielorusia", "chechenia", "siberia", "kazakhstan"],
    "chechenia": ["ucrania", "turquia", "iran", "rusia", "kazakhstan"],
    "kazakhstan": ["rusia", "chechenia", "iran", "china", "siberia"],
    "siberia": ["rusia", "kazakhstan", "china", "kamtchatka"],
    "china": ["kazakhstan", "siberia", "india", "vietnam", "corea"],
    "vietnam": ["india", "china", "filipinas", "sumatra"],
    "filipinas": ["vietnam", "corea", "micronesia"],
    "corea": ["china", "japon", "filipinas", "kamtchatka"],
    "japon": ["corea", "kamtchatka"],
    "kamtchatka": ["alaska", "siberia", "corea", "japon"],
    "sumatra": ["india", "vietnam", "madagascar", "australia"],
    "australia": ["sumatra", "micronesia", "tonga", "nueva-zelanda"],
    "micronesia": ["australia", "filipinas", "islas-marshall", "tonga"],
    "islas-marshall": ["micronesia", "tonga"],
    "tonga": ["micronesia", "islas-marshall", "australia", "nueva-zelanda"],
    "nueva-zelanda": ["australia", "tonga"]
  });

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
    mapHelp: document.querySelector("#mapHelp"),
    attackPanel: document.querySelector("#attackPanel"),
    board: document.querySelector("#board"),
    finishTurnBtn: document.querySelector("#finishTurnBtn"),
    resetBtn: document.querySelector("#resetBtn"),
    copyCodeBtn: document.querySelector("#copyCodeBtn"),
    countryTemplate: document.querySelector("#countryTemplate")
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
    render();
  });

  els.leaveLobbyBtn.addEventListener("click", () => {
    if (unsubscribeRoom) unsubscribeRoom();
    unsubscribeRoom = null;
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
    els.lobbyHint.textContent = backend.mode === "firebase"
      ? "Modo online activo: los jugadores pueden unirse desde otras compus o celulares con este codigo."
      : "Modo local: para jugar desde distintas compus/celulares completa firebase-config.js con tu configuracion.";
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
    renderMapHelp();
    renderAttackPanel();
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
    els.board.className = hasBoardImage ? "board world-map with-board-image" : "board world-map";
    if (boardImagePath) {
      els.board.style.backgroundImage = `linear-gradient(rgba(10, 15, 19, 0.02), rgba(10, 15, 19, 0.03)), url("${boardImagePath}")`;
    } else {
      els.board.style.backgroundImage = "";
    }
    renderLandMasses();
    renderRoutes();
    continents.forEach((continent) => {
      const label = document.createElement("div");
      label.className = `continent-map-label label-${continent.id}`;
      label.innerHTML = `<span class="continent-dot" style="background:${continent.color}"></span>${continent.name}`;
      els.board.appendChild(label);
    });
    countryData.forEach((country) => {
      els.board.appendChild(countryButton(country));
    });
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
    [
      ["norteamerica", "8,23 18,18 32,25 35,40 29,54 35,66 26,75 15,65 10,50 4,37"],
      ["centroamerica", "27,73 39,72 45,80 40,87 31,83"],
      ["sudamerica", "42,86 55,84 62,96 58,115 50,126 43,116 45,101"],
      ["europa", "47,25 67,27 78,38 75,55 62,61 52,52"],
      ["africa", "56,70 73,69 81,88 75,112 66,123 55,96"],
      ["asia", "76,34 106,28 124,40 122,70 112,88 91,87 78,70"],
      ["oseania", "100,98 121,94 128,113 118,126 105,119"]
    ].forEach(([continentId, points]) => {
      const continent = continents.find((item) => item.id === continentId);
      const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      polygon.setAttribute("points", points);
      polygon.setAttribute("fill", continent?.color || "#667085");
      polygon.setAttribute("class", "land-shape");
      svg.appendChild(polygon);
    });
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
    const canAttack = isNeighbor && getSelectedCountry()?.ownerId === localPlayerId && data.ownerId !== localPlayerId;
    button.className = "country map-country";
    button.type = "button";
    button.style.left = `${toMapXPercent(position[0])}%`;
    button.style.top = `${toMapPercent(position[1])}%`;
    button.style.setProperty("--country-color", continent?.color || "#667085");
    button.innerHTML = `
      <span class="country-name">${escapeHtml(country.name)}</span>
      <span class="country-meta">
        <span class="owner-dot" style="background:${color?.value || "#667085"}"></span>
        <span class="army-count">${data.armies}</span>
      </span>
    `;
    button.classList.toggle("owned-by-me", data.ownerId === localPlayerId);
    button.classList.toggle("selected-country", isSelected);
    button.classList.toggle("neighbor-country", Boolean(isNeighbor));
    button.classList.toggle("attack-country", Boolean(canAttack));
    button.classList.toggle("disabled-click", !canPlaceOn(country.id));
    button.title = owner ? `${owner.name} - ${data.armies} fichas` : country.name;
    button.addEventListener("click", () => handleCountryClick(country.id));
    return button;
  }

  function handleCountryClick(countryId) {
    selectedCountryId = countryId;
    if (canPlaceOn(countryId)) {
      placeArmy(countryId);
      return;
    }
    renderGame();
  }

  function renderMapHelp() {
    if (state.phase === "placement") {
      els.mapHelp.textContent = "Toca tus paises para poner fichas. Al tocar cualquier pais tambien se resaltan sus limitrofes.";
      return;
    }
    els.mapHelp.textContent = "Toca un pais propio para ver a quien puede atacar. Los vecinos enemigos aparecen resaltados.";
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
    const attackable = adjacent.filter((item) => state.countries[item.id]?.ownerId !== localPlayerId && data?.ownerId === localPlayerId);
    els.attackPanel.innerHTML = `
      <div><strong>${country?.name || "Pais"}</strong> - ${owner?.name || "Sin dueno"} - ${data?.armies || 0} tropas</div>
      <div><span>Limitrofes:</span> ${adjacent.map((item) => item.name).join(", ") || "sin cargar"}</div>
      <div><span>Podrias atacar:</span> ${attackable.map((item) => item.name).join(", ") || "ninguno ahora"}</div>
    `;
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

  async function saveState() {
    await backend.saveRoom(state);
  }

  async function loadRoom(code) {
    return backend.loadRoom(code);
  }

  function subscribeToRoom(code) {
    if (unsubscribeRoom) unsubscribeRoom();
    unsubscribeRoom = backend.subscribeRoom(code, (room) => {
      if (!room) {
        state = null;
        render();
        return;
      }
      state = room;
      render();
    });
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

  function getCountry(id) {
    return countryData.find((country) => country.id === id);
  }

  function getSelectedCountry() {
    return selectedCountryId ? state?.countries[selectedCountryId] : null;
  }

  function getColor(id) {
    return colors.find((color) => color.id === id);
  }

  function toMapPercent(value) {
    return (value / MAP_SIZE) * 100;
  }

  function toMapXPercent(value) {
    if (!hasBoardImage) return toMapPercent(value);
    const horizontalImagePadding = 8;
    return horizontalImagePadding + (value / MAP_SIZE) * (100 - horizontalImagePadding * 2);
  }

  function makeRoomCode() {
    let code = "";
    do {
      code = Math.random().toString(36).slice(2, 8).toUpperCase();
    } while (backend.mode === "local" && localStorage.getItem(storageKey(code)));
    return code;
  }

  function createBackend() {
    const config = window.TEG_FIREBASE_CONFIG;
    const canUseFirebase = Boolean(config?.apiKey && config?.databaseURL && window.firebase?.database);
    if (canUseFirebase) {
      if (!firebase.apps.length) firebase.initializeApp(config);
      const db = firebase.database();
      return {
        mode: "firebase",
        async saveRoom(room) {
          await db.ref(`rooms/${room.code}`).set(room);
        },
        async loadRoom(code) {
          const snapshot = await db.ref(`rooms/${code}`).get();
          return snapshot.exists() ? snapshot.val() : null;
        },
        subscribeRoom(code, callback) {
          const ref = db.ref(`rooms/${code}`);
          ref.on("value", (snapshot) => callback(snapshot.exists() ? snapshot.val() : null));
          return () => ref.off();
        }
      };
    }

    return {
      mode: "local",
      async saveRoom(room) {
        localStorage.setItem(storageKey(room.code), JSON.stringify(room));
      },
      async loadRoom(code) {
        const raw = localStorage.getItem(storageKey(code));
        return raw ? JSON.parse(raw) : null;
      },
      subscribeRoom() {
        return () => {};
      }
    };
  }

  function detectBoardImage(index = 0) {
    if (index >= BOARD_IMAGE_CANDIDATES.length) return;
    const image = new Image();
    image.onload = () => {
      hasBoardImage = true;
      boardImagePath = BOARD_IMAGE_CANDIDATES[index];
      if (state?.phase !== "lobby") renderGame();
    };
    image.onerror = () => detectBoardImage(index + 1);
    image.src = BOARD_IMAGE_CANDIDATES[index];
  }

  function normalizeNeighbors(map) {
    const normalized = {};
    Object.entries(map).forEach(([countryId, countryNeighbors]) => {
      if (!normalized[countryId]) normalized[countryId] = [];
      countryNeighbors.forEach((neighborId) => {
        if (!normalized[countryId].includes(neighborId)) normalized[countryId].push(neighborId);
        if (!normalized[neighborId]) normalized[neighborId] = [];
        if (!normalized[neighborId].includes(countryId)) normalized[neighborId].push(countryId);
      });
    });
    return normalized;
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
