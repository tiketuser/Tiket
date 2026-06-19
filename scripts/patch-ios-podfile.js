#!/usr/bin/env node
/**
 * Patches the @capacitor-firebase/authentication plugin so native Google
 * Sign-In actually works on iOS, then runs `pod install` if anything changed.
 *
 * Why this exists:
 *   The plugin docs say to use `:subspecs => ['Google']` in the Podfile. With
 *   a `:path =>` development pod that produces a broken aggregate target —
 *   no source files compile, the plugin returns UNIMPLEMENTED at runtime.
 *
 *   Workaround: declare GoogleSignIn as a top-level dependency in the
 *   plugin's podspec, plus the Swift compile flag. CocoaPods then generates
 *   a real PBXNativeTarget with the right framework search paths.
 *
 *   The podspec lives in node_modules and would be wiped by npm install,
 *   so this script re-applies it idempotently. It runs after `cap sync ios`
 *   (wired in package.json) and can also be run manually after npm install.
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const PODSPEC = path.join(
  ROOT,
  "node_modules",
  "@capacitor-firebase",
  "authentication",
  "CapacitorFirebaseAuthentication.podspec",
);
const POD_DIR = path.join(ROOT, "ios", "App");

const PODSPEC_NEEDLE = `  s.dependency 'Capacitor'
  s.dependency 'FirebaseAuth', '~> 11.0'
  s.swift_version = '5.1'`;
const PODSPEC_PATCHED = `  s.dependency 'Capacitor'
  s.dependency 'FirebaseAuth', '~> 11.0'
  s.dependency 'GoogleSignIn', '7.1.0'
  s.xcconfig = { 'OTHER_SWIFT_FLAGS' => '$(inherited) -DRGCFA_INCLUDE_GOOGLE' }
  s.swift_version = '5.1'`;

function patchPodspec() {
  if (!fs.existsSync(PODSPEC)) {
    console.error(`patch: ${PODSPEC} not found, skipping`);
    return false;
  }
  const original = fs.readFileSync(PODSPEC, "utf8");
  if (original.includes("RGCFA_INCLUDE_GOOGLE")) {
    return false;
  }
  if (!original.includes(PODSPEC_NEEDLE)) {
    console.error("patch: podspec layout unexpected, skipping");
    return false;
  }
  fs.writeFileSync(
    PODSPEC,
    original.replace(PODSPEC_NEEDLE, PODSPEC_PATCHED),
    "utf8",
  );
  console.log("patch: added GoogleSignIn dep + RGCFA_INCLUDE_GOOGLE to podspec");
  return true;
}

const changed = patchPodspec();
if (!changed) {
  console.log("patch: nothing to do");
  process.exit(0);
}

if (!fs.existsSync(path.join(POD_DIR, "Podfile"))) {
  console.error("patch: ios/App/Podfile missing, can't run pod install");
  process.exit(0);
}

const result = spawnSync("pod", ["install"], { cwd: POD_DIR, stdio: "inherit" });
process.exit(result.status ?? 0);
