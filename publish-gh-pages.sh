#!/bin/bash

# Exit on error
set -e

gulp clean
gulp publish

clone=$(mktemp -d)
repo=$(pwd)
head=$(git rev-parse HEAD)

rm -rf "$clone"
mkdir "$clone"
cd "$clone"

pwd

git clone "${repo}/.git" .
git checkout gh-pages
rm -rf *

cp -rv "${repo}/public/"* .

git add .
git commit -m"gh-pages from ${head}"
git push origin gh-pages

cd "${repo}"
