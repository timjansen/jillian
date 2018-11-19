#!/bin/sh

cd ~/workspace/jillian
if [ -n "$1" ]; then
	tsc && mocha `find test/ -name $1*-test.js`
else
	tsc || exit 1
  mocha --recursive test/jel/ || exit 1
  mocha --recursive test/database/ || exit 1
  rm -rf build/tmp
  mkdir -p build/tmp
  node test/bootstrap/load.js || exit 1
  mocha test/bootstrap/*-test.js || exit 1
fi





