#!/usr/bin/env node
/**
 * Mobile static-export build wrapper.
 *
 * `output: "export"` is incompatible with API routes and `force-dynamic` pages.
 * The mobile app calls https://tiket.co.il/api/... and Firestore directly
 * from the client, so the bundled static shell does not need any of those.
 *
 * Strategy:
 *   1. Stash entire directories that should not ship to the mobile app at all
 *      (admin tools, dev/internal pages, server-side data-fetching pages
 *      pending refactor).
 *   2. Strip `export const dynamic = "force-dynamic"` from remaining pages
 *      (already client components or pure-render servers — defensive declaration
 *      that breaks static export).
 *   3. Run `next build` with MOBILE_BUILD=1.
 *   4. Restore everything on exit (success or failure).
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const STASH_DIR = path.join(ROOT, ".mobile-build-stash");

// Whole directories that the mobile app does not need.
// Admin / internal tools never ship to the consumer apps.
// Favorites/ViewMore/EventPage/SearchResults need a server→client refactor —
// stashed for now; will be reintroduced once converted.
const STASH_TARGETS = [
  // Admin
  path.join(ROOT, "app", "Admin"),
  path.join(ROOT, "app", "manage-artists"),
  path.join(ROOT, "app", "manage-categories"),
  path.join(ROOT, "app", "manage-themes"),
  path.join(ROOT, "app", "manage-default-images"),
  path.join(ROOT, "app", "edit-events"),
  path.join(ROOT, "app", "fix-dates"),
  path.join(ROOT, "app", "migrate"),
  path.join(ROOT, "app", "diagnostic"),
  path.join(ROOT, "app", "regenerate-tickets"),
  path.join(ROOT, "app", "approve-tickets"),
  // API — runs on Cloud Run, not in mobile bundle
  path.join(ROOT, "app", "api"),
  // Dynamic-segment pages — `output: "export"` requires generateStaticParams
  // and we don't have a build-time list of event titles or queries.
  // Mobile navigation will use query-param routing
  // (/EventPage?t=… and /SearchResults?q=…) — refactor pending.
  path.join(ROOT, "app", "EventPage", "[title]"),
  path.join(ROOT, "app", "SearchResults", "[query]"),
  // Middleware not supported in `output: "export"` — only used by Cloud Run
  // for /api CORS preflight.
  path.join(ROOT, "middleware.ts"),
];

// Pages where `export const dynamic = "force-dynamic"` is defensive but blocks
// static export. Strip the line for the mobile build only.
const STRIP_FORCE_DYNAMIC = [
  path.join(ROOT, "app", "page.tsx"),
  path.join(ROOT, "app", "MyListings", "page.tsx"),
  path.join(ROOT, "app", "MyTickets", "page.tsx"),
];

const FORCE_DYNAMIC_RE = /^[ \t]*\/\/[^\n]*\n[ \t]*export\s+const\s+dynamic\s*=\s*["']force-dynamic["'];?[ \t]*\n|^[ \t]*export\s+const\s+dynamic\s*=\s*["']force-dynamic["'];?[ \t]*\n/m;

const moved = [];
const patched = [];

function stashTarget(target) {
  if (!fs.existsSync(target)) return;
  if (!fs.existsSync(STASH_DIR)) fs.mkdirSync(STASH_DIR, { recursive: true });
  const stashName = path.relative(ROOT, target).replace(/[/\\\[\]]/g, "_");
  const stashed = path.join(STASH_DIR, stashName);
  if (fs.existsSync(stashed)) {
    throw new Error(
      `Refusing to overwrite ${stashed} — clean .mobile-build-stash from a previous failed build.`,
    );
  }
  fs.renameSync(target, stashed);
  moved.push({ from: stashed, to: target });
}

function patchFile(file) {
  if (!fs.existsSync(file)) return;
  const original = fs.readFileSync(file, "utf8");
  if (!FORCE_DYNAMIC_RE.test(original)) return;
  const updated = original.replace(FORCE_DYNAMIC_RE, "");
  fs.writeFileSync(file, updated, "utf8");
  patched.push({ file, original });
}

function restoreAll() {
  while (patched.length) {
    const { file, original } = patched.pop();
    try {
      fs.writeFileSync(file, original, "utf8");
    } catch (err) {
      console.error(`Failed to restore patched ${file}:`, err.message);
    }
  }
  while (moved.length) {
    const { from, to } = moved.pop();
    try {
      if (fs.existsSync(from)) fs.renameSync(from, to);
    } catch (err) {
      console.error(`Failed to restore stashed ${to}:`, err.message);
    }
  }
  try {
    if (fs.existsSync(STASH_DIR) && fs.readdirSync(STASH_DIR).length === 0) {
      fs.rmdirSync(STASH_DIR);
    }
  } catch {
    // best effort
  }
}

process.on("SIGINT", () => {
  restoreAll();
  process.exit(130);
});
process.on("SIGTERM", () => {
  restoreAll();
  process.exit(143);
});

let exitCode = 0;
try {
  for (const target of STASH_TARGETS) stashTarget(target);
  for (const file of STRIP_FORCE_DYNAMIC) patchFile(file);

  const result = spawnSync("npx", ["next", "build"], {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, MOBILE_BUILD: "1" },
  });
  exitCode = result.status ?? 1;
} catch (err) {
  console.error("Mobile build wrapper failed:", err);
  exitCode = 1;
} finally {
  restoreAll();
}

process.exit(exitCode);
