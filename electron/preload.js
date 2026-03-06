const { contextBridge, ipcRenderer } = require("electron");

ipcRenderer.on("pitlane-fullscreen", (_, isFullscreen) => {
  window.dispatchEvent(new CustomEvent("pitlane-fullscreen", { detail: isFullscreen }));
});

contextBridge.exposeInMainWorld("pitlane", {
  platform: process.platform,
  versions: process.versions,
  isElectron: true,
  close: () => ipcRenderer.send("window-close"),
  minimize: () => ipcRenderer.send("window-minimize"),
  maximize: () => ipcRenderer.send("window-maximize"),
  isFullscreen: () => ipcRenderer.invoke("window-is-fullscreen"),
  isMaximized: () => ipcRenderer.invoke("window-is-maximized"),
  onFullscreenChange: (cb) => {
    const handler = (e) => cb(e.detail);
    window.addEventListener("pitlane-fullscreen", handler);
    return () => window.removeEventListener("pitlane-fullscreen", handler);
  },
});
