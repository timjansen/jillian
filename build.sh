#!/bin/sh

alias tsc=./node_modules/typescript/bin/tsc

cd "$(dirname "$0")"
tsc || exit 1

