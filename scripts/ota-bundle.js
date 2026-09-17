#!/usr/bin/env node
/**
 * Package the mobile static export (`out/`) as an OTA bundle and publish it to
 * the channel's folder in the GCS bucket, then refresh that channel's manifest.
 *
 * Expects `out/` to already exist (run `npm run build:mobile` first, with the
 * channel's NEXT_PUBLIC_OTA_CHANNEL / NEXT_PUBLIC_MOBILE_API_BASE_URL baked in).
 * `npm run ota:build` does both.
 *
 * The app (lib/ota.ts) polls `<bucket>/ota/<channel>/manifest.json`, compares
 * `version` to its running bundle, and downloads `url` when newer.
 *
 * Env:
 *   OTA_CHANNEL   staging | production   (default: production)
 *   OTA_VERSION   monotonic id           (default: unix-ms; CI passes run number)
 *   OTA_BUCKET    gs://… bucket          (default: gs://tiket-ota)
 *   OTA_PUBLIC_BASE  https URL base      (default: https://storage.googleapis.com/tiket-ota)
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "out");
const WORK = path.join(ROOT, "build", "ota");

const CHANNEL = process.env.OTA_CHANNEL === "staging" ? "staging" : "production";
const VERSION = String(process.env.OTA_VERSION || Date.now());
const BUCKET = (process.env.OTA_BUCKET || "gs://tiket-ota").replace(/\/$/, "");
const PUBLIC_BASE = (
  process.env.OTA_PUBLIC_BASE || "https://storage.googleapis.com/tiket-ota"
).replace(/\/$/, "");

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { stdio: "inherit", ...opts });
}

if (!fs.existsSync(path.join(OUT, "index.html"))) {
  console.error(
    "out/index.html not found — run `npm run build:mobile` before ota-bundle.",
  );
  process.exit(1);
}

fs.mkdirSync(WORK, { recursive: true });
const zipPath = path.join(WORK, `${VERSION}.zip`);
if (fs.existsSync(zipPath)) fs.rmSync(zipPath);

// Zip the *contents* of out/ (index.html at the archive root — Capgo requires it).
run("zip", ["-r", "-q", zipPath, "."], { cwd: OUT });

const remoteZip = `${BUCKET}/ota/${CHANNEL}/${VERSION}.zip`;
const publicZip = `${PUBLIC_BASE}/ota/${CHANNEL}/${VERSION}.zip`;

// Immutable versioned zip → cache hard.
run("gcloud", [
  "storage",
  "cp",
  zipPath,
  remoteZip,
  "--cache-control=public,max-age=31536000,immutable",
]);

const manifest = {
  version: VERSION,
  url: publicZip,
  channel: CHANNEL,
  notes: process.env.OTA_NOTES || "",
  publishedAt: new Date().toISOString(),
};
const manifestPath = path.join(WORK, "manifest.json");
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

// Manifest is the pointer → must never be cached.
run("gcloud", [
  "storage",
  "cp",
  manifestPath,
  `${BUCKET}/ota/${CHANNEL}/manifest.json`,
  "--cache-control=no-cache,max-age=0",
]);

console.log(`OTA published: ${CHANNEL} v${VERSION} -> ${publicZip}`);
