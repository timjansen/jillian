'use strict';

const assert = require('assert');
const serializer = require('../../src/jel/serializer.js');
const JEL = require('../../src/jel/jel.js'); 
const JelType = require('../../src/jel/type.js'); 

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

class JelPromise extends JelType {
	static create(value) {
		return new Promise((resolve)=>setTimeout(()=>resolve(value), 1));
	}
	static resolve(value) {
		return Promise.resolve(value);
	}
}
JelPromise.create_jel_mapping = ['value'];
JelPromise.resolve_jel_mapping = ['value'];

class JelConsole extends JelType {
	static create(firstValue, ...values) {
		console.log(' ---------- JelConsole: ', firstValue, ...values);
		return firstValue;
	}
}
JelConsole.create_jel_mapping = ['value'];


module.exports = {equal, notEqual, JelPromise, JelConsole};

