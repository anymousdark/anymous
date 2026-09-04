/* Any HUD — liga o HUD ao backend anymous (/api/ask, /api/listen, /api/speak).
   Reusa setState/addLog/displayResponse de app.js via eventos. */
(function () {
  const voiceBtn = document.getElementById("voiceBtn");
  const textInput = document.getElementById("textInput");
  const sendBtn = document.getElementById("sendBtn");

  let agent = "any";
  let recorder = null;
  let chunks = [];

  // seletor de agente na top bar
  async function loadAgents() {
    try {
      const r = await fetch("/api/agents");
      const { agents } = await r.json();
      const bar = document.querySelector(".top-bar__right");
      const sel = document.createElement("select");
      sel.id = "agentSel";
      sel.style.cssText =
        "background:#0a0a0a;color:#7dd3fc;border:1px solid #1e3a8a88;border-radius:8px;padding:4px 8px;font:inherit;font-size:12px";
      sel.innerHTML = agents
        .map((a) => `<option value="${a.name}"${a.name === "any" ? " selected" : ""}>${a.name}</option>`)
        .join("");
      sel.onchange = () => (agent = sel.value);
      bar.prepend(sel);
    } catch {}
  }

  async function speak(text) {
    try {
      const r = await fetch("/api/speak", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 500) }),
      });
      const blob = await r.blob();
      await new Audio(URL.createObjectURL(blob)).play();
    } catch {}
  }

  async function ask(text) {
    window.__anySetState && window.__anySetState("processing");
    const r = await fetch("/api/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text, agent }),
    });
    const { answer } = await r.json();
    return answer || "(sem resposta)";
  }

  // expõe hook usado pelo app.js adaptado
  window.AnyBackend = { ask, speak, loadAgents };

  async function toggleMic() {
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks = [];
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      window.__anySetState && window.__anySetState("processing");
      const fd = new FormData();
      fd.append("audio", new Blob(chunks, { type: "audio/webm" }));
      try {
        const r = await fetch("/api/listen", { method: "POST", body: fd });
        const { text } = await r.json();
        if (text) {
          window.__anyOnUserText && window.__anyOnUserText(text);
        } else {
          window.__anySetState && window.__anySetState("idle");
        }
      } catch {
        window.__anySetState && window.__anySetState("idle");
      }
    };
    recorder.start();
    window.__anySetState && window.__anySetState("listening");
  }

  voiceBtn.addEventListener("click", toggleMic);
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && document.activeElement !== textInput) {
      e.preventDefault();
      toggleMic();
    }
  });

  sendBtn.addEventListener("click", () => {
    const t = textInput.value.trim();
    if (t) {
      window.__anyOnUserText && window.__anyOnUserText(t);
      textInput.value = "";
    }
  });
  textInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendBtn.click();
  });

  loadAgents();
})();
