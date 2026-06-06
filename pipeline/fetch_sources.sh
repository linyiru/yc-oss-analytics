#!/usr/bin/env bash
# Fetch upstream yc-oss datasets used by build_candidates.py.
# These are regenerable caches and are not committed.
set -euo pipefail
cd "$(dirname "$0")"

echo "fetching yc-oss sources..."
curl -fsSL "https://yc-oss.github.io/api/tags/open-source.json" -o _src_opensource_tag.json
curl -fsSL "https://raw.githubusercontent.com/yc-oss/open-source-companies/main/repositories.json" -o _src_repositories.json
curl -fsSL "https://raw.githubusercontent.com/yc-oss/api/main/companies/all.json" -o _src_all.json

echo "done:"
ls -lh _src_*.json | awk '{print "  "$5"  "$9}'
