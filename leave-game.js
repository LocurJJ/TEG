(function () {
  const CURRENT_ROOM_KEY = "teg2-current-room";

  if (new URLSearchParams(window.location.search).has("salir")) {
    leaveGame();
    return;
  }

  window.addEventListener("load", () => {
    const copyButton = document.querySelector("#copyCodeBtn");
    if (!copyButton || document.querySelector("#leaveGameBtn")) return;

    const button = document.createElement("button");
    button.className = "secondary leave-game-btn";
    button.id = "leaveGameBtn";
    button.type = "button";
    button.textContent = "Salir";
    button.addEventListener("click", leaveGame);
    copyButton.insertAdjacentElement("afterend", button);
  });

  function leaveGame() {
    sessionStorage.removeItem(CURRENT_ROOM_KEY);
    const params = new URLSearchParams(window.location.search);
    params.delete("room");
    params.delete("salir");
    params.delete("calibrar");
    params.set("v", Date.now().toString(36));
    window.location.replace(`${window.location.pathname}?${params.toString()}`);
  }
})();
