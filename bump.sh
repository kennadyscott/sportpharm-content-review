#!/bin/sh
# Bump the cache-busting build number in ONE place.
#
# Three things have to agree or the stale-cache guard in hq-boot.js is worse
# than useless: the ?v=N on every asset, window.HQ_BUILD baked into
# index.html, and build.txt. Doing it by hand drifted twice.
set -e
cd "$(dirname "$0")"
CUR=$(grep -o 'hq-data.js?v=[0-9]*' index.html | head -1 | sed 's/.*v=//')
NEXT=$((CUR + 1))
sed -i '' "s/?v=$CUR/?v=$NEXT/g" index.html
sed -i '' "s/window.HQ_BUILD = \"[0-9]*\"/window.HQ_BUILD = \"$NEXT\"/" index.html
printf '%s\n' "$NEXT" > build.txt
echo "$CUR -> $NEXT"
# Fail loudly if anything is still on the old number.
if grep -q "?v=$CUR" index.html; then echo "STILL ON $CUR — check index.html"; exit 1; fi
echo "assets: $(grep -c "?v=$NEXT" index.html)  build.txt: $(cat build.txt)  baked: $(grep -o 'HQ_BUILD = "[0-9]*"' index.html)"
