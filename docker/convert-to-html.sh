#!/usr/bin/env bash
set -euo pipefail

cd "$1" || exit 1

emacs  -batch  -l /root/.emacs     index.org     -f org-update-all-dblocks -f org-table-iterate-buffer-tables -f org-re-reveal-export-to-html --kill
