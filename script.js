const body = document.body;
const overlay = document.querySelector("[data-modal-overlay]");
const modals = document.querySelectorAll(".modal");
const modalTriggers = document.querySelectorAll("[data-modal-trigger], [data-modal-target]");
const terminal = document.getElementById("terminal");
const openTerminalButtons = document.querySelectorAll("[data-open-terminal]");
const closeTerminalButton = document.querySelector("[data-close-terminal]");
const terminalOutput = document.getElementById("terminal-output");
const terminalForm = document.getElementById("terminal-form");
const terminalInput = document.getElementById("terminal-input");
const terminalSubmit = terminalForm?.querySelector("button[type='submit']");
const ledGreen = document.querySelector("[data-term-green]");
const ledAmber = document.querySelector("[data-term-amber]");
const ledRed = document.querySelector("[data-term-red]");
const VIM_FALLBACK_URL = "https://rhysd.github.io/vim.wasm/";
let vimSession = null;
let vimFullscreen = false;
const HISTORY_KEY = "terminal-history";

const setFullscreen = (enabled) => {
  vimFullscreen = !!enabled;
  if (vimFullscreen) {
    terminal?.classList.add("is-fullscreen");
    body.classList.add("no-scroll");
  } else {
    terminal?.classList.remove("is-fullscreen");
    body.classList.remove("no-scroll");
  }
};

const loadHistory = () => {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

let history = loadHistory();
let historyIndex = history.length;
const saveHistory = () => {
  try {
    const trimmed = history.slice(-100);
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    history = trimmed;
  } catch {
    // Ignore storage failures
  }
};

const addHistory = (entry) => {
  if (!entry || !entry.trim()) return;
  history.push(entry);
  historyIndex = history.length;
  saveHistory();
};

const applyHistoryToInput = (value) => {
  if (!terminalInput) return;
  terminalInput.value = value;
  const pos = value.length;
  terminalInput.setSelectionRange(pos, pos);
};
document.querySelector("[data-toggle-crt]")?.addEventListener("click", () => {
  body.classList.toggle("crt");
});

document.querySelector("[data-toggle-palette]")?.addEventListener("click", () => {
  body.classList.toggle("alt-palette");
});

openTerminalButtons.forEach((btn) =>
  btn.addEventListener("click", () => {
    terminal.classList.add("is-open");
    terminalInput?.focus();
  })
);

closeTerminalButton?.addEventListener("click", () => {
  if (vimSession) teardownVim("Closed vim.");
  terminal.classList.remove("is-open");
  setFullscreen(false);
});

const pushLine = (text, className) => {
  const line = document.createElement("div");
  line.className = "line";
  if (className) line.classList.add(className);
  line.innerHTML = text;
  terminalOutput?.appendChild(line);
  terminalOutput?.scrollTo({ top: terminalOutput.scrollHeight, behavior: "smooth" });
};
window.pushTerminalLine = pushLine;

const terminalAPI = window.buildTerminalCommands(pushLine);
const commands = {
  ...terminalAPI.commands,
};
const completeInput = terminalAPI.complete;

terminalForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (terminal?.classList.contains("vim-mode")) return;
  const raw = terminalInput.value.trim();
  if (!raw) return;
  const [cmd, ...args] = raw.split(/\s+/);
  const key = cmd.toLowerCase();
  pushLine(`$ ${raw}`, "accent");
  addHistory(raw);
  if (commands[key]) {
    commands[key](args);
  } else {
    pushLine(`command not found: ${cmd}`);
  }
  terminalInput.value = "";
});

terminalInput?.addEventListener("keydown", (event) => {
  if (terminal?.classList.contains("vim-mode")) return;
  if (event.key === "Tab") {
    event.preventDefault();
    if (!completeInput) return;
    const completed = completeInput(terminalInput.value);
    if (completed) terminalInput.value = completed;
  } else if (event.key === "ArrowUp") {
    if (!history.length) return;
    event.preventDefault();
    historyIndex = Math.max(0, historyIndex - 1);
    applyHistoryToInput(history[historyIndex] ?? "");
  } else if (event.key === "ArrowDown") {
    if (!history.length) return;
    event.preventDefault();
    historyIndex = Math.min(history.length, historyIndex + 1);
    const nextValue = historyIndex === history.length ? "" : history[historyIndex] ?? "";
    applyHistoryToInput(nextValue);
  }
});

const openModal = (id) => {
  modals.forEach((modal) => modal.classList.remove("is-active"));
  const target = document.getElementById(id);
  if (!target) return;
  target.classList.add("is-active");
  overlay?.classList.add("is-visible");
};

const closeModal = () => {
  overlay?.classList.remove("is-visible");
  modals.forEach((modal) => modal.classList.remove("is-active"));
};

modalTriggers.forEach((card) => {
  const id = card.getAttribute("data-modal-trigger") || card.getAttribute("data-modal-target");
  card.addEventListener("click", () => openModal(id));
});

document.querySelectorAll("[data-close-modal]").forEach((btn) => {
  btn.addEventListener("click", closeModal);
});

overlay?.addEventListener("click", (event) => {
  if (event.target === overlay) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (terminal?.classList.contains("vim-mode")) {
    if (event.key === "Escape") {
      event.preventDefault();
      teardownVim("Exited vim.");
    }
    return;
  }
  if (event.key === "Escape") {
    closeModal();
    terminal.classList.remove("is-open");
  }
});
const teardownVim = (message = "Exited vim.") => {
  if (vimSession?.wrap && vimSession.wrap.parentElement) {
    vimSession.wrap.parentElement.removeChild(vimSession.wrap);
  }
  vimSession = null;
  terminal?.classList.remove("vim-mode");
  setFullscreen(false);
  if (terminalInput) {
    terminalInput.disabled = false;
  }
  if (terminalSubmit) terminalSubmit.disabled = false;
  pushLine(message);
  terminalInput?.focus();
};

const createVimEmbed = () => {
  const wrap = document.createElement("div");
  wrap.className = "vim-embed";

  const body = document.createElement("div");
  body.className = "vim-embed__body";

  const status = document.createElement("div");
  status.className = "vim-embed__status";
  status.textContent = "Loading vim.wasm…";

  wrap.append(body, status);
  return { wrap, body, status };
};

const launchVimIframe = (body, status) => {
  body.innerHTML = "";
  const iframe = document.createElement("iframe");
  iframe.className = "vim-embed__iframe";
  iframe.src = VIM_FALLBACK_URL;
  iframe.loading = "lazy";
  iframe.referrerPolicy = "no-referrer";
  iframe.sandbox = "allow-scripts allow-same-origin allow-modals";
  body.appendChild(iframe);
  iframe.addEventListener(
    "error",
    () => {
      status.innerHTML = `Iframe blocked. Open directly: <a href="${VIM_FALLBACK_URL}" target="_blank" rel="noreferrer">vim.wasm</a>`;
    },
    { once: true }
  );
  status.textContent = "";
  status.style.display = "none";
  vimSession = { wrap: body.parentElement, iframe };
};

const launchVimInTerminal = async (useFullscreen = false) => {
  if (vimSession) {
    pushLine("vim: already running (press Esc to return).");
    return;
  }
  if (terminal) terminal.classList.add("vim-mode");
  setFullscreen(useFullscreen);
  if (terminalInput) terminalInput.disabled = true;
  if (terminalSubmit) terminalSubmit.disabled = true;
  const parts = createVimEmbed();
  if (terminal && terminalOutput) {
    terminal.insertBefore(parts.wrap, terminalOutput);
  } else {
    terminalOutput?.appendChild(parts.wrap);
  }

  parts.status.textContent = "";
  launchVimIframe(parts.body, parts.status);
};

window.launchVimInTerminal = launchVimInTerminal;

// Window control LEDs
ledGreen?.addEventListener("click", () => {
  if (!terminal?.classList.contains("is-open")) return;
  setFullscreen(!vimFullscreen);
});

ledAmber?.addEventListener("click", () => {
  if (!terminal?.classList.contains("is-open")) return;
  setFullscreen(false);
});

ledRed?.addEventListener("click", () => {
  if (vimSession) {
    teardownVim("Exited vim.");
  } else {
    setFullscreen(false);
    terminal?.classList.remove("is-open");
  }
});

const konamiCode = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
const konamiBuffer = [];

document.addEventListener("keydown", (event) => {
  if (terminal?.classList.contains("vim-mode")) {
    if (event.key === "Escape") {
      event.preventDefault();
      teardownVim("Exited vim.");
    }
    return;
  }
  konamiBuffer.push(event.key);
  if (konamiBuffer.length > konamiCode.length) konamiBuffer.shift();
  if (konamiBuffer.join(",").toLowerCase() === konamiCode.join(",").toLowerCase()) {
    body.classList.toggle("alt-palette");
    pushLine("Konami detected → palette swapped!", "accent");
  }
});

// Rotate hero gif frames if multiple animations exist.
(() => {
  const heroGif = document.querySelector(".hero-gif");
  const stickyCover = document.querySelector(".sticky-player__cover");
  const frames = ["ugurcan.gif", "ugurcan-run.gif", "ugurcan-rotate.gif"];
  if (!heroGif || frames.length === 0) return;
  const setFrame = (index) => {
    const frame = frames[index % frames.length];
    heroGif.src = frame;
    if (stickyCover) {
      stickyCover.style.backgroundImage = `linear-gradient(180deg, rgba(11, 19, 43, 0.3), rgba(11, 19, 43, 0.7)), url("${frame}")`;
    }
  };
  window.addEventListener("bytebeat-track-change", (event) => {
    const idx = event.detail?.index ?? 0;
    setFrame(idx);
  });
  setFrame(0);
})();
