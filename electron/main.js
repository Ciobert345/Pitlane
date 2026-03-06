const { app, BrowserWindow, shell, Menu, ipcMain, nativeImage, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");

const isDev = !app.isPackaged;
const PORT_API = 4001;
const PORT_REALTIME = 4000;
const PORT_UI = 3000;

let win = null;
let childApi = null;
let childRealtime = null;
let childDashboard = null;

function getResourcesPath() {
  if (isDev) {
    return path.join(__dirname, "..");
  }
  return process.resourcesPath;
}

function getBinPath(name) {
  const resources = getResourcesPath();
  const ext = process.platform === "win32" ? ".exe" : "";
  if (isDev) {
    return path.join(resources, "target", "release", `${name}${ext}`);
  }
  return path.join(resources, "bin", `${name}${ext}`);
}

function getDashboardStandalonePath() {
  if (isDev) {
    return path.join(__dirname, "resources", "app");
  }
  return path.join(process.resourcesPath, "app");
}

function spawnBackend(name, port) {
  const binPath = getBinPath(name);
  if (!fs.existsSync(binPath)) {
    console.error(`[Pitlane] Binary not found: ${binPath}`);
    return null;
  }
  const env = {
    ...process.env,
    PORT: String(port),
    ADDRESS: `127.0.0.1:${port}`,
    ORIGIN: `http://localhost:${PORT_UI};http://127.0.0.1:${PORT_UI}`,
  };
  const child = spawn(binPath, [], {
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout?.on("data", (d) => process.stdout.write(`[${name}] ${d}`));
  child.stderr?.on("data", (d) => process.stderr.write(`[${name}] ${d}`));
  child.on("error", (err) => console.error(`[Pitlane] ${name} error:`, err));
  child.on("exit", (code) => console.log(`[Pitlane] ${name} exited with code ${code}`));
  return child;
}

function spawnDashboard() {
  const standalonePath = getDashboardStandalonePath();
  const serverJs = path.join(standalonePath, "server.js");
  if (!fs.existsSync(serverJs)) {
    console.error(`[Pitlane] Dashboard standalone not found: ${serverJs}`);
    return null;
  }
  const env = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: "1",
    PORT: String(PORT_UI),
    HOSTNAME: "127.0.0.1",
  };
  const child = spawn(process.execPath, [serverJs], {
    cwd: standalonePath,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout?.on("data", (d) => process.stdout.write(`[dashboard] ${d}`));
  child.stderr?.on("data", (d) => process.stderr.write(`[dashboard] ${d}`));
  child.on("error", (err) => console.error(`[Pitlane] dashboard error:`, err));
  child.on("exit", (code) => console.log(`[Pitlane] dashboard exited with code ${code}`));
  return child;
}

function waitFor(url, maxAttempts = 60) {
  return new Promise((resolve) => {
    const http = require("http");
    const u = new URL(url);
    let attempts = 0;
    function tryFetch() {
      const req = http.get(
        { hostname: u.hostname, port: u.port, path: u.pathname, timeout: 1000 },
        (res) => {
          resolve(true);
        }
      );
      req.on("error", () => {
        attempts++;
        if (attempts >= maxAttempts) resolve(false);
        else setTimeout(tryFetch, 500);
      });
      req.on("timeout", () => {
        req.destroy();
        attempts++;
        if (attempts >= maxAttempts) resolve(false);
        else setTimeout(tryFetch, 500);
      });
    }
    tryFetch();
  });
}

function createWindow() {
  const iconPath = path.join(__dirname, "icon.png");
  const icon = fs.existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : null;

  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    title: "Pitlane",
    icon: icon || undefined,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : undefined,
    trafficLightPosition: process.platform === "darwin" ? { x: 14, y: 14 } : undefined,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  win.once("ready-to-show", () => win.show());
  win.on("closed", () => { win = null; });
  const notifyFullscreen = () => win?.webContents.send("pitlane-fullscreen", win?.isFullScreen() || win?.isMaximized());
  win.on("enter-full-screen", () => notifyFullscreen());
  win.on("leave-full-screen", () => notifyFullscreen());
  win.on("maximize", () => notifyFullscreen());
  win.on("unmaximize", () => notifyFullscreen());

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  const url = `http://127.0.0.1:${PORT_UI}?electron=1`;
  win.loadURL(url).catch((err) => {
    console.error("[Pitlane] Failed to load dashboard:", err);
  });
}

function registerWindowIPC() {
  ipcMain.on("window-close", () => win?.close());
  ipcMain.on("window-minimize", () => win?.minimize());
  ipcMain.on("window-maximize", () => {
    if (win?.isMaximized()) win.unmaximize();
    else win?.maximize();
  });
  ipcMain.handle("window-is-maximized", () => win?.isMaximized() ?? false);
  ipcMain.handle("window-is-fullscreen", () => win?.isFullScreen() ?? false);
}

async function startServers() {
  childApi = spawnBackend("api", PORT_API);
  childRealtime = spawnBackend("realtime", PORT_REALTIME);

  const hasApi = childApi != null;
  const hasRealtime = childRealtime != null;

  if (!hasApi) console.warn("[Pitlane] API binary not found; schedule will not work.");
  if (!hasRealtime) console.warn("[Pitlane] Realtime binary not found; live data will not work.");

  childDashboard = spawnDashboard();
  if (!childDashboard) {
    const msg = "[Pitlane] Dashboard non trovato. Esegui 'node electron/build.js' dalla root del progetto.";
    console.error(msg);
    dialog.showErrorBox("Errore Pitlane", msg);
    app.quit();
    return;
  }

  const ready = await waitFor(`http://127.0.0.1:${PORT_UI}`);
  if (ready) {
    createWindow();
  } else {
    const msg = "[Pitlane] Il server della dashboard non si è avviato in tempo. Prova a riavviare l'app.";
    console.error(msg);
    dialog.showErrorBox("Errore Pitlane", msg);
    app.quit();
  }
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  registerWindowIPC();
  startServers();
});

app.on("window-all-closed", () => {
  [childApi, childRealtime, childDashboard].forEach((c) => {
    if (c && !c.killed) c.kill();
  });
  app.quit();
});

app.on("before-quit", () => {
  [childApi, childRealtime, childDashboard].forEach((c) => {
    if (c && !c.killed) c.kill();
  });
});
