// Standalone quiz generation script
// Runs via PM2 cron: pm2 start generate-cron.js --cron "0 2 * * *" --name artest-gen
// Or manually: node generate-cron.js

const { spawn } = require("child_process");
const path = require("path");

// Load env from .env file
const fs = require("fs");
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    const val = trimmed.slice(eqIdx + 1);
    if (!process.env[key]) process.env[key] = val;
  }
}

// The generation logic is bundled in the standalone server
// We trigger it via an internal HTTP call with a service token
const http = require("http");

const SERVICE_TOKEN = process.env.AUTH_SECRET || "";
const PORT = process.env.PORT || 3000;

function triggerGeneration() {
  console.log("[ARTest-Cron] Starting nightly quiz generation:", new Date().toISOString());

  const postData = JSON.stringify({});

  const options = {
    hostname: "localhost",
    port: PORT,
    path: "/api/admin/generate",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
      "X-ARTest-Service-Token": SERVICE_TOKEN,
    },
  };

  const req = http.request(options, (res) => {
    let body = "";
    res.on("data", (chunk) => (body += chunk));
    res.on("end", () => {
      console.log("[ARTest-Cron] Response:", res.statusCode, body);
      if (res.statusCode === 200) {
        console.log("[ARTest-Cron] Generation triggered successfully");
      } else {
        console.error("[ARTest-Cron] Failed to trigger generation:", res.statusCode);
      }
    });
  });

  req.on("error", (e) => {
    console.error("[ARTest-Cron] Request failed:", e.message);
  });

  req.write(postData);
  req.end();
}

// Add service token auth bypass to the generate route
// (The route checks for X-ARTest-Service-Token header matching AUTH_SECRET)
triggerGeneration();