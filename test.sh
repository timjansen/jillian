#!/bin/sh

if [ -n "$1" ]; then
	sh ./build.sh && mocha `find test/ -name $1*-test.js`
else
	sh ./build.sh || exit 1
  mocha --recursive test/jel/ || exit 1
  mocha --recursive test/database/ || exit 1
  rm -rf build/tmp
  mkdir -p build/tmp
  node test/db-init/load.js || exit 1
  mocha test/db-init/*-test.js || exit 1
fi





