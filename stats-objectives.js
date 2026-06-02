(function () {
  const STORAGE_PREFIX = "teg2-room-";
  const LOCAL_PLAYER_KEY = "teg2-local-player";
  const CURRENT_ROOM_KEY = "teg2-current-room";
  const GENERAL_TARGET = 45;
  const POLL_DELAY = 1000;

  const continents = [
    { id: "sudamerica", name: "Sudamerica", countries: ["Argentina", "Brasil", "Chile", "Uruguay", "Paraguay", "Bolivia", "Colombia", "Venezuela"] },
    { id: "centroamerica", name: "Centro America", countries: ["Jamaica", "Cuba", "El Salvador", "Honduras", "Mexico", "Nicaragua"] },
    { id: "norteamerica", name: "Norte America", countries: ["Texas", "California", "Las Vegas", "Nueva Chicago", "Oregon", "Washington", "Labrador", "Canada", "New York", "Groenlandia", "Isla Victoria", "Alaska"] },
    { id: "africa", name: "Africa", countries: ["Sahara", "Mauritania", "Sudafrica", "Madagascar", "Nigeria", "Egipto", "Kongo", "Ghana"] },
    { id: "europa", name: "Europa", countries: ["Portugal", "Espana", "Francia", "Italia", "Alemania", "Serbia", "Croacia", "Polonia", "Albania", "Ucrania", "Bielorusia", "Finlandia", "Noruega", "Islandia", "Irlanda", "Gran Bretana"] },
    { id: "asia", name: "Asia", countries: ["Arabia", "Israel", "Irak", "India", "Filipinas", "Vietnam", "Turquia", "Iran", "Rusia", "China", "Chechenia", "Siberia", "Kazakhstan", "Kamtchatka", "Japon", "Corea"] },
    { id: "oseania", name: "Oseania", countries: ["Sumatra", "Australia", "Micronesia", "Islas Marshall", "Tonga", "Nueva Zelanda"] }
  ];

  let backend = null;
  let room = null;
  let unsubscribe = null;
  let pollTimer = null;
  let savedObjectivesFor = "";

  injectStyles();
  window.addEventListener("load", boot);

  function boot() {
    backend = createBackend();
    const code = getRoomCode();
    if (!code) return;
    subscribe(code);
    startPolling(code);
  }

  function subscribe(code) {
    if (unsubscribe) unsubscribe();
    unsubscribe = backend.subscribeRoom(code, updateRoom);
  }

  function startPolling(code) {
    if (pollTimer) window.clearInterval(pollTimer);
    pollTimer = window.setInterval(async () => {
      const latest = await backend.loadRoom(code);
      updateRoom(latest);
    }, POLL_DELAY);
  }

  async function updateRoom(nextRoom) {
    if (!nextRoom || nextRoom.phase === "lobby") {
      room = nextRoom;
      renderPanel();
      return;
    }

    room = nextRoom;
    renderPanel();

    if (!room.objectives && room.players?.length) {
      const signature = `${room.code}:${room.players.map((player) => player.id).join("|")}`;
      if (savedObjectivesFor === signature) return;
      savedObjectivesFor = signature;
      const withObjectives = { ...room, objectives: buildObjectives(room.players) };
      room = withObjectives;
      renderPanel();
      await backend.saveRoom(withObjectives);
    }
  }

  function buildObjectives(players) {
    const templates = [
      (player) => ({ type: "countries", count: 24, text: "Conquistar 24 paises" }),
      (player) => ({ type: "continents", continents: ["sudamerica", "africa"], text: "Conquistar Sudamerica y Africa" }),
      (player) => ({ type: "continents", continents: ["norteamerica", "centroamerica"], text: "Conquistar Norte America y Centro America" }),
      (player) => ({ type: "continents", continents: ["europa"], text: "Conquistar Europa completa" }),
      (player) => ({ type: "continents", continents: ["asia"], text: "Conquistar Asia completa" }),
      (player, index) => {
        const target = players.find((candidate, candidateIndex) => candidateIndex !== index) || players[0];
        return { type: "eliminate", targetId: target.id, text: `Eliminar a ${target.name}` };
      }
    ];

    const objectives = {};
    players.forEach((player, index) => {
      objectives[player.id] = templates[index % templates.length](player, index);
    });
    return objectives;
  }

  function renderPanel() {
    const panel = ensurePanel();
    if (!panel || !room || room.phase === "lobby") return;

    const players = room.players || [];
    const counts = countryCounts(room);
    const rankedPlayers = [...players].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
    const localPlayerId = getLocalPlayerId();
    const me = players.find((player) => player.id === localPlayerId);
    const myCount = counts[localPlayerId] || 0;
    const generalWinner = rankedPlayers.find((player) => (counts[player.id] || 0) >= GENERAL_TARGET);
    const myObjective = me ? room.objectives?.[me.id] : null;
    const personal = myObjective && me ? evaluateObjective(room, me, myObjective, counts) : null;

    panel.innerHTML = `
      <section class="stats-block">
        <h3>Top jugadores</h3>
        <div class="stats-ranking">
          ${rankedPlayers.map((player, index) => `
            <div class="stats-row ${player.id === localPlayerId ? "is-me" : ""}">
              <span>${index + 1}. ${escapeHtml(player.name)}</span>
              <strong>${counts[player.id] || 0}</strong>
            </div>
          `).join("")}
        </div>
      </section>
      <section class="stats-block">
        <h3>Objetivo general</h3>
        <p>Conquistar ${GENERAL_TARGET} paises.</p>
        <div class="objective-progress"><span style="width: ${progressWidth(myCount, GENERAL_TARGET)}%"></span></div>
        <p class="stats-muted">Tu avance: ${myCount}/${GENERAL_TARGET}</p>
        ${generalWinner ? `<p class="objective-ok">${escapeHtml(generalWinner.name)} cumplio el objetivo general.</p>` : ""}
      </section>
      <section class="stats-block">
        <h3>Objetivo personal</h3>
        ${personal ? `
          <p>${escapeHtml(myObjective.text)}</p>
          <p class="${personal.done ? "objective-ok" : "stats-muted"}">${escapeHtml(personal.detail)}</p>
        ` : `<p class="stats-muted">Se asigna cuando empieza la partida.</p>`}
      </section>
    `;
  }

  function ensurePanel() {
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) return null;
    let panel = document.querySelector("#statsObjectivesPanel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "statsObjectivesPanel";
      panel.className = "stats-objectives";
      sidebar.appendChild(panel);
    }
    return panel;
  }

  function evaluateObjective(currentRoom, player, objective, counts) {
    if (objective.type === "countries") {
      const owned = counts[player.id] || 0;
      return {
        done: owned >= objective.count,
        detail: owned >= objective.count ? "Objetivo personal cumplido." : `Avance: ${owned}/${objective.count} paises.`
      };
    }

    if (objective.type === "continents") {
      const conquered = objective.continents.filter((continentId) => ownsContinent(currentRoom, player.id, continentId));
      return {
        done: conquered.length === objective.continents.length,
        detail: conquered.length === objective.continents.length
          ? "Objetivo personal cumplido."
          : `Continentes completos: ${conquered.length}/${objective.continents.length}.`
      };
    }

    if (objective.type === "eliminate") {
      const target = currentRoom.players?.find((candidate) => candidate.id === objective.targetId);
      const targetCount = counts[objective.targetId] || 0;
      return {
        done: targetCount === 0,
        detail: targetCount === 0
          ? "Objetivo personal cumplido."
          : `${target?.name || "Ese jugador"} todavia tiene ${targetCount} paises.`
      };
    }

    return { done: false, detail: "Objetivo pendiente." };
  }

  function ownsContinent(currentRoom, playerId, continentId) {
    const continent = continents.find((item) => item.id === continentId);
    if (!continent) return false;
    return continent.countries.every((name) => currentRoom.countries?.[slug(name)]?.ownerId === playerId);
  }

  function countryCounts(currentRoom) {
    const counts = {};
    (currentRoom.players || []).forEach((player) => { counts[player.id] = 0; });
    Object.values(currentRoom.countries || {}).forEach((country) => {
      if (country?.ownerId && counts[country.ownerId] !== undefined) counts[country.ownerId] += 1;
    });
    return counts;
  }

  function createBackend() {
    const config = window.TEG_FIREBASE_CONFIG;
    const canUseFirebase = Boolean(config?.apiKey && config?.databaseURL && window.firebase?.database);
    if (canUseFirebase) {
      if (!firebase.apps.length) firebase.initializeApp(config);
      const db = firebase.database();
      return {
        mode: "firebase",
        async saveRoom(nextRoom) { await db.ref(`rooms/${nextRoom.code}`).set(nextRoom); },
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
      async saveRoom(nextRoom) { localStorage.setItem(storageKey(nextRoom.code), JSON.stringify(nextRoom)); },
      async loadRoom(code) {
        const raw = localStorage.getItem(storageKey(code));
        return raw ? JSON.parse(raw) : null;
      },
      subscribeRoom() { return () => {}; }
    };
  }

  function getRoomCode() {
    const params = new URLSearchParams(window.location.search);
    return (params.get("room") || sessionStorage.getItem(CURRENT_ROOM_KEY) || "").trim().toUpperCase();
  }

  function getLocalPlayerId() {
    return sessionStorage.getItem(LOCAL_PLAYER_KEY) || "";
  }

  function storageKey(code) {
    return `${STORAGE_PREFIX}${code}`;
  }

  function progressWidth(value, target) {
    return Math.max(0, Math.min(100, Math.round((value / target) * 100)));
  }

  function slug(value) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
  }

  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .stats-objectives {
        background: #11161c;
        border: 1px solid var(--line);
        border-radius: 8px;
        display: grid;
        gap: 12px;
        margin-top: 18px;
        padding: 12px;
      }
      .stats-block { display: grid; gap: 8px; }
      .stats-block h3 { font-size: 14px; }
      .stats-block p { color: var(--muted); font-size: 13px; line-height: 1.45; }
      .stats-ranking { display: grid; gap: 6px; }
      .stats-row {
        align-items: center;
        background: rgba(32, 40, 51, 0.72);
        border: 1px solid transparent;
        border-radius: 8px;
        color: var(--muted);
        display: flex;
        font-size: 13px;
        justify-content: space-between;
        min-height: 30px;
        padding: 6px 8px;
      }
      .stats-row.is-me { border-color: var(--accent); color: var(--text); }
      .stats-row strong { color: var(--text); }
      .objective-progress { background: #0d1116; border: 1px solid var(--line); border-radius: 999px; height: 10px; overflow: hidden; }
      .objective-progress span { background: var(--accent); display: block; height: 100%; transition: width 180ms ease; }
      .stats-block .objective-ok { color: var(--accent); font-weight: 800; }
      .stats-block .stats-muted { color: var(--muted); }
    `;
    document.head.appendChild(style);
  }
})();
