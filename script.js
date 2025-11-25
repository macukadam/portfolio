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
const HISTORY_KEY = "terminal-history";

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
  terminal.classList.remove("is-open");
});

const pushLine = (text, className) => {
  const line = document.createElement("div");
  line.className = "line";
  if (className) line.classList.add(className);
  line.innerHTML = text;
  terminalOutput?.appendChild(line);
  terminalOutput?.scrollTo({ top: terminalOutput.scrollHeight, behavior: "smooth" });
};

const terminalAPI = window.buildTerminalCommands(pushLine);
const commands = {
  ...terminalAPI.commands,
};
const completeInput = terminalAPI.complete;

terminalForm?.addEventListener("submit", (event) => {
  event.preventDefault();
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
  if (event.key === "Escape") {
    closeModal();
    terminal.classList.remove("is-open");
  }
});

const konamiCode = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
const konamiBuffer = [];

document.addEventListener("keydown", (event) => {
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
