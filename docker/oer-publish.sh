#!/usr/bin/env bash
set -euo pipefail
cd $1
emacs --batch --load /root/elisp/publish.el
