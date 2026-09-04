/* Any HUD controller — estados + log + resposta, ligado ao AnyBackend. */
(function () {
  const statusText = document.getElementById("statusText");
  const responseText = document.getElementById("responseText");
  const logContainer = document.getElementById("logContainer");
  const orbContainer = document.getElementById("orbContainer");
  const voiceBtn = document.getElementById("voiceBtn");
  const clockDisplay = document.getElementById("clockDisplay");
  const dateDisplay = document.getElementById("dateDisplay");

  setInterval(() => {
    const now = new Date();
    if (clockDisplay) clockDisplay.textContent = now.toLocaleTimeString("en-GB", { hour12: false });
    if (dateDisplay) dateDisplay.textContent = now.toISOString().split("T")[0];
  }, 1000);

  // métricas reais do backend (CPU/RAM/uptime)
  const bars = {
    cpu: [document.getElementById("cpuBar"), document.getElementById("cpuValue")],
    mem: [document.getElementById("memBar"), document.getElementById("memValue")],
  };
  const uptimeEl = document.getElementById("uptimeVal");
  async function refreshMetrics() {
    try {
      const r = await fetch("/api/system");
      if (!r.ok) return;
      const s = await r.json();
      if (bars.cpu[0]) {
        bars.cpu[0].style.width = s.cpu + "%";
        bars.cpu[1].textContent = s.cpu + "%";
      }
      if (bars.mem[0]) {
        bars.mem[0].style.width = s.mem + "%";
        bars.mem[1].textContent = s.mem + "%";
      }
      if (uptimeEl) {
        const h = String(Math.floor(s.uptime / 3600)).padStart(2, "0");
        const m = String(Math.floor((s.uptime % 3600) / 60)).padStart(2, "0");
        const ss = String(s.uptime % 60).padStart(2, "0");
        uptimeEl.textContent = `${h}:${m}:${ss}`;
      }
    } catch {}
  }
  setInterval(refreshMetrics, 3000);
  refreshMetrics();

  function setState(state) {
    orbContainer.classList.remove("listening", "speaking");
    statusText.classList.remove("listening", "speaking");
    if (state === "listening") {
      orbContainer.classList.add("listening");
      statusText.classList.add("listening");
      statusText.textContent = "LISTENING...";
      voiceBtn.classList.add("active");
    } else if (state === "speaking") {
      orbContainer.classList.add("speaking");
      statusText.classList.add("speaking");
      statusText.textContent = "SPEAKING";
      voiceBtn.classList.remove("active");
    } else if (state === "processing") {
      statusText.textContent = "PROCESSING...";
      voiceBtn.classList.remove("active");
    } else {
      statusText.textContent = "STANDBY";
      voiceBtn.classList.remove("active");
    }
  }

  function addLog(type, text) {
    const entry = document.createElement("div");
    entry.className = `log-entry log-entry--${type}`;
    entry.innerHTML = `<span class="log-time">${new Date().toLocaleTimeString("en-GB", { hour12: false })}</span> <span class="log-text"></span>`;
    entry.querySelector(".log-text").textContent = text;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
    while (logContainer.children.length > 50) logContainer.removeChild(logContainer.firstChild);
  }

  function displayResponse(text) {
    responseText.textContent = "";
    let i = 0;
    (function type() {
      if (i < text.length) {
        responseText.textContent += text.charAt(i++);
        setTimeout(type, 12);
      }
    })();
  }

  window.__anySetState = setState;
  window.__anyOnUserText = async function (text) {
    addLog("user", text);
    setState("processing");
    try {
      const answer = await window.AnyBackend.ask(text);
      addLog("any", answer);
      displayResponse(answer);
      setState("speaking");
      await window.AnyBackend.speak(answer);
    } catch (e) {
      const msg = "Erro no provedor (instável). Tenta de novo em 1 min.";
      addLog("system", msg);
      displayResponse(msg);
    }
    setState("idle");
  };

  addLog("system", "Any online. Escreve ou prime SPACE para falar.");
})();
