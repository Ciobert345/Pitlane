const path = require("path");
const fs = require("fs");
const root = path.join(__dirname, "..");
const svg = path.join(root, "dashboard", "public", "icone", "pitlane-icon.svg");
const out = path.join(__dirname, "icon.png");
if (!fs.existsSync(svg)) process.exit(0);
require("sharp")(svg)
  .resize(256, 256)
  .png()
  .toFile(out)
  .then(() => {
    console.log("[build] Icon: electron/icon.png");
    process.exit(0);
  })
  .catch((e) => {
    console.warn("[build] Icon skip:", e.message);
    process.exit(0);
  });
