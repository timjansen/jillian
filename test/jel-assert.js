'use strict';

const assert = require('assert');
const Serializer = require('../build/jel/Serializer.js').default;
const JEL = require('../build/jel/JEL.js').default; 
const JelType = require('../build/jel/JelType.js').default; 

let ctx;

function setCtx(c) {
	ctx = c;
}

function exec(s){
	if (typeof s == 'string')
		return new JEL(s).executeImmediately(ctx);
	return s;
}

function equal(a, b, c) {
	assert.equal(Serializer.serialize(exec(a)), Serializer.serialize(exec(b)), c);
}



function notEqual(a, b, c) {
	assert.notEqual(Serializer.serialize(exec(a)), Serializer.serialize(exec(b)), c);
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
		console.log('JelConsole: ', firstValue, ...values);
		return firstValue;
	}
}
JelConsole.create_jel_mapping = ['value'];


module.exports = {setCtx, equal, notEqual, JelPromise, JelConsole};

