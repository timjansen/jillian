#!/bin/sh

alias mocha=./node_modules/mocha/bin/mocha
cd "$(dirname "$0")"

if [ -n "$1" ]; then
	sh ./build.sh && mocha `find test/ -name $1*-test.js`
else
	sh ./build.sh || exit 1

mocha --recursive test/jel/ || exit 1

  rm -rf build/tmp
  mkdir -p build/tmp
  mocha --recursive test/database/ || exit 1
  node test/db-init/load.js || exit 1
  mocha test/db-init/*-test.js || exit 1
fi





