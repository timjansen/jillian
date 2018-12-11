'use strict';

const assert = require('assert');
const Serializer = require('../build/jel/Serializer.js').default;
const JEL = require('../build/jel/JEL.js').default; 
const JelObject = require('../build/jel/JelObject.js').default; 
const JelBoolean = require('../build/jel/types/JelBoolean.js').default; 
const TypeDescriptor = require('../build/jel/types/typeDescriptors/TypeDescriptor.js').default;

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

	execPromise(s) {
		if (typeof s == 'string')
			return new JEL(s).execute(this.ctx);
		return Promise.resolve(s);
	}

	equal(a, b, c) {
		const a0 = this.exec(a);
		const b0 = this.exec(b);
		if (a0 instanceof Promise)
			a0.then(e=>console.log('Equal returned promise: ', e), e=>console.log('Equal returned rejected promise: ', e));
		if (b0 instanceof Promise)
			b0.then(e=>console.log('Equal returned promise: ', e), e=>console.log('Equal returned rejected promise: ', e));
		assert.equal(Serializer.serialize(a0), Serializer.serialize(b0), c);
	}

	notEqual(a, b, c) {
		assert.notEqual(Serializer.serialize(this.exec(a)), Serializer.serialize(this.exec(b)), c);
	}

	equalPromise(a, b, c) {
		const a0 = this.execPromise(a), b0 = this.execPromise(b);
		return Promise.all([a0, b0]).then(x=>this.equal(Serializer.serialize(x[0]), Serializer.serialize(x[1]), c));
	}

 	errorPromise(a, c) {
		const a0 = this.execPromise(a);
		return a0.then(()=>false).catch(()=>true).then(v=>assert.ok(v, c||"expected error / rejected promise"));
	}

  
	fuzzy(a, min, max) {
		const r = this.exec(a);
		if (!(r instanceof JelBoolean)) {
			if (r instanceof Promise)
				r.then(m=>console.log('Promise from failed assertion resolved to ', m));
			throw new Error("Failed to return JelBoolean. Got a " + (r && r.constructor.name)+": "+r);
		}
		if (max != null) {
			assert.ok(r.state >= min, `Expected fuzzy boolean min=${min} max=${max}, but got state=${r.state}`);
			assert.ok(r.state <= max, `Expected fuzzy boolean min=${min} max=${max}, but got state=${r.state}`);
		}
		else
			assert.ok(r.state == min, `Expected fuzzy boolean with state=${min}, but got state=${r.state}`);
	}

	fuzzyPromise(a, min, max) {
		return this.execPromise(a).then(r=>{
			if (max != null) {
				assert.ok(r.state >= min, `Expected fuzzy boolean min=${min} max=${max}, but got state=${r.state}`);
				assert.ok(r.state <= max, `Expected fuzzy boolean min=${min} max=${max}, but got state=${r.state}`);
			}
			else
				assert.ok(r.state == min, `Expected fuzzy boolean with state=${min}, but got state=${r.state}`);
		});
	}
}

let next = 0;

class JelPromise extends JelObject {
	static resetRnd() {
		next = 0;
	}
	static create(ctx, value) {
		return new Promise((resolve)=>setTimeout(()=>resolve(value), 1));
	}
	static rnd(ctx, value) {
		next++;
		if (next % 3 === 0)
			return JelPromise.create(ctx, value);
		else if (next % 3 == 1)
			return JelPromise.resolve(ctx, value);
		else
			return value;
	}
	static resolve(ctx, value) {
		return Promise.resolve(value);
	}
}
JelPromise.create_jel_mapping = ['value'];
JelPromise.resolve_jel_mapping = ['value'];
JelPromise.rnd_jel_mapping = ['value'];

class JelConsole extends JelObject {
	static create(ctx, firstValue, ...values) {
		console.log('JelConsole: ', firstValue, ...values);
		return firstValue;
	}
}
JelConsole.create_jel_mapping = ['value'];


class MockSession {
	createDbRef(distinctName, params) {
		return {distinctName, params, isIDBRef: true, getJelType: function() { return 'DbRef';}};
	}
}
MockSession.prototype.isIDBSession = true;


class PromiseType extends TypeDescriptor {
  constructor(e) {
    super();
    this.type = e;
  }

  getSerializationProperties() {
    return [this.type];
  }

  checkType(ctx, value) {
    return Promise.resolve(this.type.checkType(ctx, value));
  }

  serializeType() {
    return `${this.type}??`;
  }

  static create(ctx, ...args) {
    return new PromiseType(args[0]);
  }
}
PromiseType.create_jel_mapping = ['type'];


module.exports = {JelAssert, JelPromise, JelConsole, MockSession, PromiseType};

