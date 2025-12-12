// Fake shell commands and filesystem for the terminal
(function () {
  const HOME_DIR = "/home/ugurcan";
  const fakeFS = {
    "/": ["home"],
    "/home": ["ugurcan"],
    "/home/ugurcan": ["projects", "about", "contact"],
    "/home/ugurcan/projects": ["trading-ticker", "resu-me", "dutch-blog"],
    "/home/ugurcan/about": ["skills.txt", "education.txt", "languages.txt"],
    "/home/ugurcan/contact": ["email.txt", "links.txt"],
  };
  const fakeFiles = new Set([
    "/home/ugurcan/about/skills.txt",
    "/home/ugurcan/about/education.txt",
    "/home/ugurcan/about/languages.txt",
    "/home/ugurcan/contact/email.txt",
    "/home/ugurcan/contact/links.txt",
  ]);
  const HISTORY_KEY = "terminal-history";

  const normalizePath = (base, target) => {
    const raw = target.startsWith("/") ? target : `${base}/${target}`;
    const parts = raw.split("/").filter(Boolean);
    const stack = [];
    parts.forEach((part) => {
      if (part === ".") return;
      if (part === "..") {
        if (stack.length) stack.pop();
      } else {
        stack.push(part);
      }
    });
    return `/${stack.join("/")}`;
  };

  window.buildTerminalCommands = (pushLine) => {
    let currentPath = HOME_DIR;
    const cmdKeys = () => Object.keys(commands);
    const loadHistory = () => {
      try {
        const raw = sessionStorage.getItem(HISTORY_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    const ls = (args) => {
      const target = args?.[0] || ".";
      const path = normalizePath(currentPath, target);
      const isDir = Object.prototype.hasOwnProperty.call(fakeFS, path);
      const isFile = fakeFiles.has(path);
      if (!isDir && !isFile) {
        pushLine(`ls: no such file or directory: ${target}`);
        return;
      }
      if (isFile) {
        pushLine(path.split("/").pop());
        return;
      }
      pushLine(fakeFS[path].join("  "));
    };

    const cat = (args) => {
      const target = args?.[0];
      if (!target) {
        pushLine("cat: missing file operand");
        return;
      }
      const path = normalizePath(currentPath, target);
      if (!fakeFiles.has(path)) {
        pushLine(`cat: ${target}: No such file`);
        return;
      }
      if (path.includes("skills")) pushLine("Python, Rust, TypeScript, Dart, AWS, Docker, React, Angular, Django, Airflow");
      else if (path.includes("education")) pushLine("MS Software Engineering, Bogazici University; BS Civil Engineering, Dokuz Eylul University");
      else if (path.includes("languages")) pushLine("Turkish (Native), English (Fluent), Dutch (Intermediate)");
      else if (path.includes("email")) pushLine("ugurcan.akpulat@gmail.com");
      else if (path.includes("links")) pushLine("GitHub: macukadam · LinkedIn: /in/ugurcanakpulat");
      else pushLine("cat: nothing to read here yet.");
    };

    const tree = () => {
      pushLine(`<pre>/home
└── ugurcan
    ├── projects
    │   ├── trading-ticker
    │   ├── resu-me
    │   └── dutch-blog
    ├── about
    │   ├── skills.txt
    │   ├── education.txt
    │   └── languages.txt
    └── contact
        ├── email.txt
        └── links.txt</pre>`);
    };

    const commands = {
      help: () => {
        pushLine("Available: projects, about, email, resume, music [play|pause|next|status], vim [full], history, ls, cd, pwd, cat, dir, tree, net, sudo, apt, apt-get, clear (use ↑/↓ for history)");
      },
      projects: () => {
        pushLine("Projects:");
        pushLine("- Trading Ticker → arbitrage calculator with live websockets.");
        pushLine("- RESU-ME → Rust/Yew resume builder.");
        pushLine("- Dutch Blog → Angular/Ionic social blogging app.");
      },
      about: () => {
        pushLine("Team Lead @ Swishfund; Founding Dev @ myclusters.nl; previously Eleena, Siemens, Lambda Construction.");
      },
      email: () => {
        pushLine("Email: <a href='mailto:ugurcan.akpulat@gmail.com'>ugurcan.akpulat@gmail.com</a>");
      },
      resume: () => {
        pushLine("Resume: request copy via email.");
      },
      ls,
      dir: ls,
      cd: (args) => {
        const target = args?.[0] || HOME_DIR;
        const path = normalizePath(currentPath, target);
        const isDir = Object.prototype.hasOwnProperty.call(fakeFS, path);
        if (!isDir) {
          pushLine(`cd: no such file or directory: ${target}`);
          return;
        }
        currentPath = path;
        pushLine(currentPath);
      },
      pwd: () => {
        pushLine(currentPath);
      },
      cat,
      tree,
      net: () => pushLine("net: sandboxed; network access restricted."),
      sudo: () => pushLine("sudo: permission denied (nice try)"),
      apt: () => pushLine("apt: not available in this pixelverse."),
      "apt-get": () => pushLine("apt-get: not available in this pixelverse."),
      history: () => {
        const items = loadHistory();
        if (!items.length) {
          pushLine("history: (empty)");
          return;
        }
        items.forEach((cmd, idx) => {
          pushLine(`${idx + 1}  ${cmd}`);
        });
      },
      music: (args = []) => {
        const player = window.BytebeatPlayer;
        if (!player) {
          pushLine("music: player not ready.");
          return;
        }
        const action = (args[0] || "status").toLowerCase();
        const showStatus = () => {
          const state = player.state ? player.state() : null;
          const label = player.label ? player.label() : "Unknown track";
          const playing = state?.isRunning ? "playing" : "paused";
          pushLine(`Now: ${label} (${playing})`);
        };
        const run = (result, message) =>
          Promise.resolve(result)
            .then(() => {
              if (message) pushLine(message);
              showStatus();
            })
            .catch(() => pushLine("music: command failed."));
        switch (action) {
          case "play":
            run(player.play?.(), "Playback resumed.");
            break;
          case "pause":
          case "stop":
            run(player.pause?.(), "Playback paused.");
            break;
          case "next":
          case "skip":
            run(player.next?.(), "Skipped to next track.");
            break;
          case "status":
            showStatus();
            break;
          default:
            pushLine("Usage: music [play|pause|next|status]");
        }
      },
      vim: (args = []) => {
        if (typeof window.launchVimInTerminal === "function") {
          const wantsFullscreen = args.some((a) => ["full", "fs", "max", "-f", "--full"].includes(a.toLowerCase()));
          pushLine(`Booting vim.wasm inside terminal${wantsFullscreen ? " (fullscreen)" : ""}…`);
          window.launchVimInTerminal(wantsFullscreen);
        } else {
          pushLine("vim: loader not ready.");
        }
      },
      clear: () => {
        const output = document.getElementById("terminal-output");
        if (output) output.innerHTML = "";
      },
      exit: () => {
        const term = document.getElementById("terminal");
        if (term) term.classList.remove("is-open");
        pushLine("Session closed. Reopen the terminal to continue.");
      },
    };

    const complete = (raw) => {
      if (!raw) return "";
      const tokens = raw.split(/\s+/);
      const cursorOnCommand = tokens.length === 1 && !raw.endsWith(" ");
      if (cursorOnCommand) {
        const partial = tokens[0].toLowerCase();
        const match = cmdKeys().find((c) => c.startsWith(partial));
        return match ? match : raw;
      }
      const lastToken = tokens[tokens.length - 1];
      const parentPath = lastToken.includes("/") ? normalizePath(currentPath, lastToken.split("/").slice(0, -1).join("/")) : currentPath;
      const partialName = lastToken.includes("/") ? lastToken.split("/").pop() : lastToken;
      const entries = fakeFS[parentPath] || [];
      const match = entries.find((e) => e.startsWith(partialName));
      if (!match) return raw;
      const prefix = lastToken.includes("/") ? `${lastToken.split("/").slice(0, -1).join("/")}/` : "";
      const full = `${prefix}${match}`;
      const fullPath = normalizePath(currentPath, full);
      const isDir = Object.prototype.hasOwnProperty.call(fakeFS, fullPath);
      const completedToken = isDir ? `${full}/` : full;
      tokens[tokens.length - 1] = completedToken;
      return tokens.join(" ");
    };

    return {
      commands,
      complete,
    };
  };
})();
