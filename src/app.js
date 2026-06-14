(() => {
  "use strict";

  const panel        = document.getElementById("cw-panel");
  const bubbleBtn    = document.getElementById("cw-bubble-btn");
  const badge        = document.getElementById("cw-badge");
  const closeBtn     = document.getElementById("cw-close");
  const input        = document.getElementById("cw-input");
  const sendBtn      = document.getElementById("cw-send");
  const messagesEl   = document.getElementById("cw-messages");
  const typingEl     = document.getElementById("cw-typing");
  const quickReplies = document.getElementById("cw-quick-replies");
  const statusDot    = document.getElementById("cw-status-dot");
  const statusText   = document.getElementById("cw-status-text");
  const botNameEl    = document.getElementById("cw-bot-name");
  const welcomeMsg   = document.getElementById("cw-welcome-msg");
  const clearBtn     = document.getElementById("cw-clear");

  let isOpen       = false;
  let isLoading    = false;
  let ollamaOnline = false;
  let chatHistory  = [];

  const STORAGE_KEY = `cw-history-${CONFIG.siteName}`;

  function init() {
    botNameEl.textContent = CONFIG.botName;

    buildQuickReplies();
    loadHistory();
    checkOllamaStatus();
    setInterval(checkOllamaStatus, 30000);
  }

  function buildQuickReplies() {
    quickReplies.innerHTML = "";
    (CONFIG.quickReplies || []).forEach(({ label, text }) => {
      const btn = document.createElement("button");
      btn.className   = "cw-qr";
      btn.textContent = label;
      btn.addEventListener("click", () => sendMsg(text));
      quickReplies.appendChild(btn);
    });
  }

  function saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory));
    } catch (_) {}
  }

  function loadHistory() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return;

      // hide welcome + quick replies if we have history
      welcomeMsg.style.display = "none";
      quickReplies.style.display = "none";

      chatHistory = parsed;
      chatHistory.forEach(({ role, content, ts }) => {
        if (role === "user")      appendMsg(content, "user", ts, false);
        else if (role === "assistant") appendMsg(content, "bot", ts, false);
      });
    } catch (_) {}
  }

  function clearHistory() {
    chatHistory = [];
    localStorage.removeItem(STORAGE_KEY);
    messagesEl.innerHTML = "";

    const welcome = document.createElement("div");
    welcome.className   = "cw-msg bot";
    welcome.id          = "cw-welcome-msg";
    welcome.textContent = `👋 Hi! I'm ${CONFIG.botName}. Ask me anything about ${CONFIG.siteName}!`;
    messagesEl.appendChild(welcome);

    quickReplies.style.display = "flex";
    buildQuickReplies();
  }

  async function checkOllamaStatus() {
    try {
      const res = await fetch(`${CONFIG.ollamaBaseUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        const data     = await res.json();
        const models   = data.models || [];
        const hasModel = models.some(m => m.name.startsWith(CONFIG.model));

        if (hasModel) {
          setStatus("online", "Online");
          ollamaOnline = true;
        } else {
          setStatus("error", `Run: ollama pull ${CONFIG.model}`);
          ollamaOnline = false;
        }
      } else {
        setStatus("error", "Ollama not found");
        ollamaOnline = false;
      }
    } catch {
      setStatus("error", "Start Ollama app first");
      ollamaOnline = false;
    }
  }

  function setStatus(state, text) {
    statusDot.className    = `cw-dot ${state}`;
    statusText.textContent = text;
  }

  bubbleBtn.addEventListener("click", () => {
    isOpen = !isOpen;
    panel.classList.toggle("open", isOpen);
    if (isOpen) {
      badge.style.display = "none";
      setTimeout(() => input.focus(), 100);
    }
  });

  closeBtn.addEventListener("click", () => {
    isOpen = false;
    panel.classList.remove("open");
  });

  clearBtn.addEventListener("click", clearHistory);

  function renderMarkdown(text) {
    if (window.marked) {
      return marked.parse(text, { breaks: true, gfm: true });
    }
    return text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");
  }

  function formatTime(ts) {
    const d = ts ? new Date(ts) : new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function appendMsg(text, who, ts, scroll = true) {
    const wrap = document.createElement("div");
    wrap.className = `cw-msg-wrap ${who}`;

    const bubble = document.createElement("div");
    bubble.className = `cw-msg ${who}`;

    if (who === "bot") {
      bubble.innerHTML = renderMarkdown(text);
    } else {
      bubble.textContent = text;
    }

    const meta = document.createElement("div");
    meta.className   = "cw-meta";
    meta.textContent = formatTime(ts);

    if (who === "bot") {
      const copyBtn = document.createElement("button");
      copyBtn.className   = "cw-copy";
      copyBtn.title       = "Copy message";
      copyBtn.innerHTML   = `<svg viewBox="0 0 24 24"><path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"/></svg>`;
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
          setTimeout(() => {
            copyBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"/></svg>`;
          }, 1500);
        });
      });
      meta.prepend(copyBtn);
    }

    wrap.appendChild(bubble);
    wrap.appendChild(meta);
    messagesEl.appendChild(wrap);

    if (scroll) messagesEl.scrollTop = messagesEl.scrollHeight;

    if (!isOpen && who === "bot") badge.style.display = "block";

    return bubble; // return bubble so streaming can update it
  }

  function appendError(text) {
    const d = document.createElement("div");
    d.className   = "cw-msg err";
    d.textContent = text;
    messagesEl.appendChild(d);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function setLoading(loading) {
    isLoading        = loading;
    input.disabled   = loading;
    sendBtn.disabled = loading;
    typingEl.classList.toggle("show", loading);
    if (loading) messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function trimHistory() {
    if (chatHistory.length > CONFIG.maxHistoryMessages) {
      chatHistory = chatHistory.slice(-CONFIG.maxHistoryMessages);
    }
  }

  async function sendMsg(text) {
    text = text.trim();
    if (!text || isLoading) return;

    if (!ollamaOnline) {
      appendError("Ollama isn't running. Open the Ollama app, then refresh this page.");
      return;
    }

    const ts = Date.now();
    appendMsg(text, "user", ts);
    input.value = "";
    quickReplies.style.display = "none";
    setLoading(true);

    chatHistory.push({ role: "user", content: text, ts });
    trimHistory();

   
    const replyTs     = Date.now();
    const botBubble   = appendMsg("", "bot", replyTs);
    let   fullReply   = "";

    try {
      const res = await fetch(`${CONFIG.ollamaBaseUrl}/api/chat`, {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({
          model   : CONFIG.model,
          messages: [
            { role: "system", content: CONFIG.systemPrompt },
            ...chatHistory.map(({ role, content }) => ({ role, content })),
          ],
          stream : true,
          options: {
            num_predict: CONFIG.maxTokens,
            temperature: 0.7,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      typingEl.classList.remove("show");

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            const token = json?.message?.content || "";
            fullReply += token;
            botBubble.innerHTML = renderMarkdown(fullReply);
            messagesEl.scrollTop = messagesEl.scrollHeight;
          } catch (_) {}
        }
      }

      if (!fullReply) fullReply = "Sorry, I didn't get a response. Please try again!";

      chatHistory.push({ role: "assistant", content: fullReply, ts: replyTs });
      trimHistory();
      saveHistory();

    } catch (err) {
      chatHistory.pop();
      botBubble.closest(".cw-msg-wrap")?.remove();
      appendError(`Error: ${err.message}. Make sure Ollama is running and the model is downloaded.`);
      console.error("[Chatbot] Ollama error:", err);
    } finally {
      setLoading(false);
    }
  }

  sendBtn.addEventListener("click", () => sendMsg(input.value));

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMsg(input.value);
    }
  });

  init();

})();