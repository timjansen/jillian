'use strict';

const assert = require('assert');
const serializer = require('../../src/jel/serializer.js');
const JEL = require('../../src/jel/jel.js'); 

function exec(s){
	if (typeof s == 'string')
		return new JEL(s).execute();
	return s;
}

function equal(a, b, c) {
	assert.equal(serializer.serialize(exec(a)), serializer.serialize(exec(b)), c);
}


function notEqual(a, b, c) {
	assert.notEqual(serializer.serialize(exec(a)), serializer.serialize(exec(b)), c);
}

module.exports = {equal, notEqual};

