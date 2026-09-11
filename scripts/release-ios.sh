#!/usr/bin/env bash
#
# Local iOS release — build + upload a TestFlight build from the Mac.
#
# iOS archiving needs macOS and can't run for free on a private-repo CI, so this
# stays local. Everything else (web, OTA, Android) is automated in CI.
#
#   npm run release:ios            # staging channel → staging API + TestFlight
#   npm run release:ios -- --prod  # production channel → tiket.co.il  (run from `main`)
#
# The OTA channel is baked into the binary here: a staging build tracks the
# staging OTA channel, a prod build tracks production. Do NOT promote a staging
# TestFlight build to the App Store — cut the App Store build with --prod.
#
# Prereqs (see memory ios-app-store-status / ios-appstoreconnect-api):
#   - Xcode + CocoaPods, Apple ID added in Xcode → Settings → Accounts
#   - ASC API key at ~/.appstoreconnect/private_keys/AuthKey_F94XU3Y6H2.p8
set -euo pipefail

cd "$(dirname "$0")/.."

CHANNEL="staging"
API_BASE="https://tiket-app-staging-653453593991.me-west1.run.app"
if [ "${1:-}" = "--prod" ]; then
  CHANNEL="production"
  API_BASE="https://tiket.co.il"
  CUR_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
  if [ "$CUR_BRANCH" != "main" ]; then
    echo "WARNING: building a production binary from branch '$CUR_BRANCH' (expected main)."
  fi
fi

ASC_KEY_ID="F94XU3Y6H2"
ASC_ISSUER_ID="eb3f94dc-ca11-413b-900d-9d4b42e430c3"
BUILD_NUMBER="$(date +%Y%m%d%H%M)"

echo "→ iOS release: channel=$CHANNEL  api=$API_BASE  build=$BUILD_NUMBER"

# 1. Build the static export for this channel and sync into the iOS project.
#    Firebase/Stripe NEXT_PUBLIC_* come from .env (Next.js loads it automatically).
NEXT_PUBLIC_OTA_CHANNEL="$CHANNEL" \
NEXT_PUBLIC_MOBILE_API_BASE_URL="$API_BASE" \
  npm run cap:sync:ios

# 2. Monotonic build number (ASC rejects duplicates).
( cd ios/App && agvtool new-version -all "$BUILD_NUMBER" )

# 3. Ensure export options exist (build/ is gitignored).
mkdir -p build
if [ ! -f build/ExportOptions.plist ]; then
  cat > build/ExportOptions.plist <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key><string>app-store-connect</string>
  <key>teamID</key><string>ZY5V3ZY2YW</string>
  <key>destination</key><string>export</string>
  <key>signingStyle</key><string>automatic</string>
  <key>uploadSymbols</key><true/>
</dict>
</plist>
PLIST
fi

# 4. Archive + export.
xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -archivePath build/App.xcarchive \
  -allowProvisioningUpdates clean archive
xcodebuild -exportArchive -archivePath build/App.xcarchive -exportPath build/ipa \
  -exportOptionsPlist build/ExportOptions.plist -allowProvisioningUpdates

# 5. Upload to App Store Connect (auto-lands in TestFlight internal groups).
xcrun altool --upload-app -f build/ipa/App.ipa -t ios \
  --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID"

echo "✅ Uploaded iOS build $BUILD_NUMBER ($CHANNEL). Processing in TestFlight shortly."
