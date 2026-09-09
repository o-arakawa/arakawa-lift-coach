#!/usr/bin/env bash
# Download the cover fonts (Noto Sans JP / Noto Serif JP, SIL Open Font License) into ../../fonts/
# Only needed when re-rendering the cover with render_cover.js.
set -euo pipefail
cd "$(dirname "$0")/../.."
mkdir -p fonts
curl -sSL -o fonts/NotoSansJP.ttf  "https://raw.githubusercontent.com/google/fonts/main/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf"
curl -sSL -o fonts/NotoSerifJP.ttf "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifjp/NotoSerifJP%5Bwght%5D.ttf"
ls -la fonts/
