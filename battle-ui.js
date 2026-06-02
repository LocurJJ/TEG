(function () {
  const STORAGE_PREFIX = "teg2-room-";
  const LOCAL_PLAYER_KEY = "teg2-local-player";
  const CURRENT_ROOM_KEY = "teg2-current-room";
  const REVEAL_DELAY = 1250;
  let room = null;
  let backend = null;
  let unsubscribe = null;
  let rolling = false;

  injectStyles();
  window.addEventListener("load", boot);

  function boot() {
    backend = createBackend();
    const code = getRoomCode();
    if (code) subscribe(code);
    document.addEventListener("click", interceptAttack, true);
  }

  function subscribe(code) {
    if (unsubscribe) unsubscribe();
    unsubscribe = backend.subscribeRoom(code, (nextRoom) => {
      room = nextRoom;
      renderBattle();
    });
  }

  function interceptAttack(event) {
    const attackButton = event.target.closest(".attack-option, .map-country.attack-country");
    if (!attackButton || rolling) return;
    const code = getRoomCode();
    if (!code) return;
    if (!room) subscribe(code);
    const selected = document.querySelector(".map-country.selected-country");
    if (!selected) return;

    const fromId = slug(selected.querySelector(".country-name")?.textContent || "");
    const toId = attackButton.dataset.target || slug(attackButton.querySelector(".country-name")?.textContent || "");
    const latest = room;
    if (!latest || latest.battle) return;
    const from = latest.countries?.[fromId];
    const to = latest.countries?.[toId];
    const playerId = getLocalPlayerId();
    if (!from || !to || from.ownerId !== playerId || to.ownerId === playerId || from.armies <= 1) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const attackerDiceCount = Math.min(3, from.armies - 1);
    const defenderDiceCount = Math.min(3, to.armies);
    const nextRoom = JSON.parse(JSON.stringify(latest));
    nextRoom.battle = {
      fromId,
      toId,
      attackerId: playerId,
      defenderId: to.ownerId,
      attackerDice: rollDice(attackerDiceCount),
      defenderDice: rollDice(defenderDiceCount),
      revealed: 0,
      createdAt: Date.now()
    };
    backend.saveRoom(nextRoom);
  }

  async function revealNext() {
    if (!room?.battle || rolling || room.battle.attackerId !== getLocalPlayerId()) return;
    rolling = true;
    renderBattle(true);
    window.setTimeout(async () => {
      const latest = await backend.loadRoom(room.code);
      if (!latest?.battle) {
        rolling = false;
        renderBattle();
        return;
      }
      const total = latest.battle.attackerDice.length + latest.battle.defenderDice.length;
      latest.battle.revealed = Math.min(total, (latest.battle.revealed || 0) + 1);
      if (latest.battle.revealed >= total) resolveBattle(latest);
      await backend.saveRoom(latest);
      rolling = false;
      renderBattle();
    }, REVEAL_DELAY);
  }

  function resolveBattle(latest) {
    const battle = latest.battle;
    const from = latest.countries[battle.fromId];
    const to = latest.countries[battle.toId];
    let attackerLosses = 0;
    let defenderLosses = 0;
    for (let index = 0; index < Math.min(battle.attackerDice.length, battle.defenderDice.length); index += 1) {
      if (battle.attackerDice[index] > battle.defenderDice[index]) defenderLosses += 1;
      else attackerLosses += 1;
    }
    from.armies -= attackerLosses;
    to.armies -= defenderLosses;
    let log = `${countryName(battle.fromId)} ataco a ${countryName(battle.toId)}. Dados: ${battle.attackerDice.join("-")} vs ${battle.defenderDice.join("-")}. Perdidas: atacante ${attackerLosses}, defensor ${defenderLosses}.`;
    if (to.armies <= 0) {
      const maxMove = Math.max(1, from.armies - 1);
      let move = Math.min(maxMove, battle.attackerDice.length);
      if (battle.attackerId === getLocalPlayerId()) {
        const requested = Number(window.prompt(`Conquistaste ${countryName(battle.toId)}. Cuantas tropas queres mover? 1 a ${maxMove}`, String(move)));
        move = clampInt(Number.isFinite(requested) ? requested : move, 1, maxMove);
      }
      from.armies -= move;
      to.ownerId = battle.attackerId;
      to.armies = move;
      log += ` Conquista: entraron ${move} tropas.`;
    }
    latest.attack = latest.attack || { turnIndex: 0, log: null };
    latest.attack.log = log;
    latest.battle = null;
  }

  function renderBattle(isRolling = false) {
    const existing = document.querySelector(".battle-modal");
    if (!room?.battle) {
      existing?.remove();
      return;
    }
    const battle = room.battle;
    const total = battle.attackerDice.length + battle.defenderDice.length;
    const revealed = battle.revealed || 0;
    const canReveal = battle.attackerId === getLocalPlayerId() && revealed < total;
    const modal = existing || document.createElement("div");
    modal.className = "battle-modal";
    modal.innerHTML = `
      <div class="battle-card">
        <p class="eyebrow">Batalla</p>
        <h2>${countryName(battle.fromId)} vs ${countryName(battle.toId)}</h2>
        <div class="slot-columns">
          ${diceColumn("Atacante", battle.attackerDice, 0, revealed, isRolling && canReveal)}
          ${diceColumn("Defensor", battle.defenderDice, battle.attackerDice.length, revealed, isRolling && canReveal)}
        </div>
        <button class="battle-reveal" type="button" ${canReveal && !isRolling ? "" : "disabled"}>${isRolling ? "Girando..." : revealed >= total ? "Resolviendo..." : "Revelar numero"}</button>
      </div>
    `;
    modal.querySelector(".battle-reveal")?.addEventListener("click", revealNext);
    if (!existing) document.body.appendChild(modal);
  }

  function diceColumn(title, dice, offset, revealed, isRolling) {
    const slots = dice.map((value, index) => {
      const visible = revealed > offset + index;
      return `<span class="slot-number ${isRolling && !visible && revealed === offset + index ? "rolling" : ""}">${visible ? value : "?"}</span>`;
    }).join("");
    return `<div class="slot-side"><strong>${title}</strong><div class="slot-row">${slots}</div></div>`;
  }

  function createBackend() {
    const config = window.TEG_FIREBASE_CONFIG;
    const canUseFirebase = Boolean(config?.apiKey && config?.databaseURL && window.firebase?.database);
    if (canUseFirebase) {
      if (!firebase.apps.length) firebase.initializeApp(config);
      const db = firebase.database();
      return {
        async saveRoom(nextRoom) { await db.ref(`rooms/${nextRoom.code}`).set(nextRoom); },
        async loadRoom(code) { const snapshot = await db.ref(`rooms/${code}`).get(); return snapshot.exists() ? snapshot.val() : null; },
        subscribeRoom(code, callback) { const ref = db.ref(`rooms/${code}`); ref.on("value", (snapshot) => callback(snapshot.exists() ? snapshot.val() : null)); return () => ref.off(); }
      };
    }
    return {
      async saveRoom(nextRoom) { localStorage.setItem(`${STORAGE_PREFIX}${nextRoom.code}`, JSON.stringify(nextRoom)); window.dispatchEvent(new StorageEvent("storage", { key: `${STORAGE_PREFIX}${nextRoom.code}`, newValue: JSON.stringify(nextRoom) })); },
      async loadRoom(code) { const raw = localStorage.getItem(`${STORAGE_PREFIX}${code}`); return raw ? JSON.parse(raw) : null; },
      subscribeRoom(code, callback) { const tick = () => callback(JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}${code}`) || "null")); tick(); window.addEventListener("storage", tick); return () => window.removeEventListener("storage", tick); }
    };
  }

  function getRoomCode() {
    const params = new URLSearchParams(window.location.search);
    return (params.get("room") || sessionStorage.getItem(CURRENT_ROOM_KEY) || "").trim().toUpperCase();
  }

  function getLocalPlayerId() {
    return sessionStorage.getItem(LOCAL_PLAYER_KEY);
  }

  function rollDice(amount) { return Array.from({ length: amount }, () => 1 + Math.floor(Math.random() * 6)).sort((a, b) => b - a); }
  function countryName(id) { return id.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
  function slug(value) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
  function clampInt(value, min, max) { return Math.min(Math.max(Math.trunc(value), min), max); }

  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .battle-modal { align-items: center; background: rgba(5, 8, 12, 0.58); display: flex; inset: 0; justify-content: center; padding: 20px; position: fixed; z-index: 3000; }
      .battle-card { background: rgba(17, 22, 28, 0.96); border: 1px solid var(--accent); border-radius: 8px; box-shadow: var(--shadow); display: grid; gap: 16px; max-width: 560px; padding: 18px; text-align: center; width: min(100%, 560px); }
      .battle-card h2 { font-size: 24px; }
      .slot-columns { display: grid; gap: 14px; grid-template-columns: 1fr 1fr; }
      .slot-side { background: #0d1116; border: 1px solid var(--line); border-radius: 8px; display: grid; gap: 10px; padding: 12px; }
      .slot-row { display: flex; gap: 8px; justify-content: center; min-height: 58px; }
      .slot-number { align-items: center; background: linear-gradient(180deg, #f8fafc, #b6c2d2); border: 2px solid #0d1116; border-radius: 8px; color: #111827; display: inline-flex; font-size: 30px; font-weight: 950; height: 54px; justify-content: center; min-width: 48px; }
      .slot-number.rolling { animation: slotRoll 160ms linear infinite; }
      .battle-reveal { justify-self: center; min-width: 180px; }
      @keyframes slotRoll { 0% { transform: translateY(-4px); filter: brightness(1.35); } 50% { transform: translateY(4px); filter: brightness(0.9); } 100% { transform: translateY(-4px); filter: brightness(1.35); } }
      @media (max-width: 620px) { .slot-columns { grid-template-columns: 1fr; } .battle-card { padding: 14px; } }
    `;
    document.head.appendChild(style);
  }
})();
