#!/bin/sh
# Run before every push (installed as .git/hooks/pre-push). Blocks the push if the page is broken.
# © 2026 Randy Barnhill. All rights reserved.
set -e
cd "$(git rev-parse --show-toplevel)"

node tools/sitecheck.mjs
