(function () {
  const STORAGE_PREFIX = "teg2-room-";
  const LOCAL_PLAYER_KEY = "teg2-local-player";
  const CURRENT_ROOM_KEY = "teg2-current-room";
  let backend = null;

  window.addEventListener("load", () => {
    backend = createBackend();
    document.addEventListener("click", interceptFinishTurn, true);
  });

  async function interceptFinishTurn(event) {
    const button = event.target.closest("#finishTurnBtn");
    if (!button || button.disabled) return;
    const code = getRoomCode();
    if (!code) return;
    const room = await backend.loadRoom(code);
    if (!room || room.phase !== "attack" || room.battle) return;
    const localPlayerId = sessionStorage.getItem(LOCAL_PLAYER_KEY);
    const turnIndex = room.attack?.turnIndex || 0;
    if (room.players?.[turnIndex]?.id !== localPlayerId) return;
    if (turnIndex < room.players.length - 1) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    room.phase = "placement";
    room.attack = null;
    room.placement = {
      round: 2,
      turnIndex: 0,
      turns: room.players.map((player) => ({
        playerId: player.id,
        remaining: reinforcementCount(room, player.id)
      }))
    };
    await backend.saveRoom(room);
  }

  function reinforcementCount(room, playerId) {
    const countries = Object.values(room.countries || {}).filter((country) => country.ownerId === playerId).length;
    return Math.max(4, Math.floor(countries / 2));
  }

  function createBackend() {
    const config = window.TEG_FIREBASE_CONFIG;
    const canUseFirebase = Boolean(config?.apiKey && config?.databaseURL && window.firebase?.database);
    if (canUseFirebase) {
      if (!firebase.apps.length) firebase.initializeApp(config);
      const db = firebase.database();
      return {
        async saveRoom(room) { await db.ref(`rooms/${room.code}`).set(room); },
        async loadRoom(code) { const snapshot = await db.ref(`rooms/${code}`).get(); return snapshot.exists() ? snapshot.val() : null; }
      };
    }
    return {
      async saveRoom(room) { localStorage.setItem(`${STORAGE_PREFIX}${room.code}`, JSON.stringify(room)); window.dispatchEvent(new StorageEvent("storage", { key: `${STORAGE_PREFIX}${room.code}`, newValue: JSON.stringify(room) })); },
      async loadRoom(code) { const raw = localStorage.getItem(`${STORAGE_PREFIX}${code}`); return raw ? JSON.parse(raw) : null; }
    };
  }

  function getRoomCode() {
    const params = new URLSearchParams(window.location.search);
    return (params.get("room") || sessionStorage.getItem(CURRENT_ROOM_KEY) || "").trim().toUpperCase();
  }
})();
