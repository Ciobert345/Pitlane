/**
 * Prepara risorse per l'app Electron:
 * - Compila api e realtime (Rust)
 * - Compila la dashboard Next.js in modalità standalone (localhost)
 * - Copia binari e app in electron/resources/
 *
 * Esegui dalla root del repo: node electron/build.js
 * Oppure da electron/: node build.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const electronDir = __dirname;
const resourcesDir = path.join(electronDir, "resources");
const binDir = path.join(resourcesDir, "bin");
const appDir = path.join(resourcesDir, "app");
const isWin = process.platform === "win32";
const ext = isWin ? ".exe" : "";

function run(cmd, opts = { cwd: root }) {
  console.log("[build] " + cmd);
  execSync(cmd, { stdio: "inherit", ...opts });
}

function cp(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn("[build] Skip (not found): " + src);
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log("[build] Copied: " + path.relative(root, dest));
}

function cpDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn("[build] Skip dir (not found): " + src);
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  function copyRecursive(s, d) {
    const entries = fs.readdirSync(s, { withFileTypes: true });
    for (const e of entries) {
      const sp = path.join(s, e.name);
      const dp = path.join(d, e.name);
      if (e.isDirectory()) {
        fs.mkdirSync(dp, { recursive: true });
        copyRecursive(sp, dp);
      } else {
        fs.copyFileSync(sp, dp);
      }
    }
  }
  copyRecursive(src, dest);
  console.log("[build] Copied dir: " + path.relative(root, dest));
}

// 0) Icona: genera icon.png da pitlane-icon.svg
if (fs.existsSync(path.join(electronDir, "node_modules", "sharp"))) {
  try {
    run("node gen-icon.js", { cwd: electronDir });
  } catch {}
} else {
  console.warn("[build] Icon: cd electron && npm install, then re-run (or export pitlane-icon.svg to icon.png manually)");
}

// 1) Rust: api e realtime
console.log("\n--- Building Rust binaries ---");
run("cargo build --release -p api -p realtime");

const target = path.join(root, "target", "release");
cp(path.join(target, "api" + ext), path.join(binDir, "api" + ext));
cp(path.join(target, "realtime" + ext), path.join(binDir, "realtime" + ext));

// 2) Dashboard: Next.js standalone (env localhost per Electron)
console.log("\n--- Building dashboard (standalone, localhost) ---");
const dashboardEnv = {
  ...process.env,
  NEXT_STANDALONE: "1",
  API_URL: "http://127.0.0.1:4001",
  NEXT_PUBLIC_LIVE_URL: "http://127.0.0.1:4000",
  SKIP_ENV_VALIDATION: "1",
};
const dashDir = path.join(root, "dashboard");
try {
  run("yarn build", { cwd: dashDir, env: dashboardEnv });
} catch {
  run("npm run build", { cwd: dashDir, env: dashboardEnv });
}

const standaloneBase = path.join(dashDir, ".next", "standalone");

function findServerJs(dir) {
  if (!fs.existsSync(dir)) return null;
  const here = path.join(dir, "server.js");
  if (fs.existsSync(here)) return here;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      const found = findServerJs(path.join(dir, e.name));
      if (found) return found;
    }
  }
  return null;
}

const serverJsPath = findServerJs(standaloneBase);
if (!serverJsPath) {
  throw new Error("Dashboard standalone build did not produce server.js. Check NEXT_STANDALONE=1 in next.config.");
}
const standaloneRoot = path.dirname(serverJsPath);
const standaloneNext = path.join(standaloneRoot, ".next");

fs.mkdirSync(standaloneNext, { recursive: true });
cpDir(path.join(dashDir, ".next", "static"), path.join(standaloneNext, "static"));
if (fs.existsSync(path.join(dashDir, "public"))) {
  cpDir(path.join(dashDir, "public"), path.join(standaloneRoot, "public"));
}

console.log("\n--- Copying dashboard to resources/app ---");
if (fs.existsSync(appDir)) {
  fs.rmSync(appDir, { recursive: true });
}
cpDir(standaloneRoot, appDir);

console.log("\n--- Done. Run from electron/: npm run start (or npm run dist to package). ---\n");
