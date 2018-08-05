#!/bin/sh

cd ~/workspace/jillian
if [ -n "$1" ]; then
	tsc && mocha `find test/ -name "$1*-test.js"`
else
	npm test
fi





