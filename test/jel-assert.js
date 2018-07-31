'use strict';

const assert = require('assert');
const Serializer = require('../build/jel/Serializer.js').default;
const JEL = require('../build/jel/JEL.js').default; 
const JelType = require('../build/jel/JelType.js').default; 
const FuzzyBoolean = require('../build/jel/types/FuzzyBoolean.js').default; 

class JelAssert {
	constructor(c) {
		this.ctx = c;
	}

	setCtx(c) {
		this.ctx = c;
	}

	exec(s){
		if (typeof s == 'string')
			return new JEL(s).executeImmediately(this.ctx);
		return s;
	}

	equal(a, b, c) {
		assert.equal(Serializer.serialize(this.exec(a)), Serializer.serialize(this.exec(b)), c);
	}

	notEqual(a, b, c) {
		assert.notEqual(Serializer.serialize(this.exec(a)), Serializer.serialize(this.exec(b)), c);
	}
	
	fuzzy(a, min, max) {
		const r = this.exec(a);
		assert.ok(r instanceof FuzzyBoolean, "Failed to return FuzzyBoolean");
		if (max != null) {
			assert.ok(r.state >= min, `Expected fuzzy boolean min=${min} max=${max}, but got state=${r.state}`);
			assert.ok(r.state <= max, `Expected fuzzy boolean min=${min} max=${max}, but got state=${r.state}`);
		}
		else
			assert.ok(r.state == min, `Expected fuzzy boolean with state=${min}, but got state=${r.state}`);
	}

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


module.exports = {JelAssert, JelPromise, JelConsole};

