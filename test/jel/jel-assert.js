'use strict';

const assert = require('assert');
const serializer = require('../../src/jel/serializer.js');

function equal(a, b, c) {
	assert.equal(serializer.serialize(a), serializer.serialize(b), c);
}


function notEqual(a, b, c) {
	assert.notEqual(serializer.serialize(a), serializer.serialize(b), c);
}

module.exports = {equal, notEqual};

