#!/usr/bin/env bash
# Assemble the deployable site into dist/.
#
# Cloudflare's asset uploader does NOT exclude .git on its own, and relying on
# .assetsignore to hold it back is one typo away from publishing the whole
# repo history. So we copy in only what the site actually needs, and point
# wrangler at that. Nothing can leak by omission.
set -euo pipefail
cd "$(dirname "$0")"

rm -rf dist && mkdir -p dist

# the app
cp index.html hq-*.js dist/
cp -R assets campaigns vendor dist/

# deliberately NOT copied: .git, README.md, DEPLOY.md, supabase/, build.sh,
# wrangler.jsonc, .assetsignore, .gitignore
echo "dist/ built — $(find dist -type f | wc -l | tr -d ' ') files, $(du -sh dist | cut -f1)"
