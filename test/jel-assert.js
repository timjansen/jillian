'use strict';

const assert = require('assert');
const Serializer = require('../build/jel/Serializer.js').default;
const JEL = require('../build/jel/JEL.js').default; 
const JelObject = require('../build/jel/JelObject.js').default; 
const BaseTypeRegistry = require('../build/jel/BaseTypeRegistry.js').default; 
const NativeJelObject = require('../build/jel/types/NativeJelObject.js').default; 
const JelBoolean = require('../build/jel/types/JelBoolean.js').default; 
const TypeDescriptor = require('../build/jel/types/typeDescriptors/TypeDescriptor.js').default;

class JelAssert {
	constructor(c) {
		this.ctx = c;
	}

	setCtx(c) {
		this.ctx = c;
	}

	exec(s, ctx){
		if (typeof s == 'string')
			return new JEL(s).executeImmediately(ctx || this.ctx);
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

	equalWithContext(ctx, a, b, c) {
		const a0 = this.exec(a, ctx);
		const b0 = this.exec(b, ctx);
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

 	errorPromise(a, snippet, c) {
    try {
  		return this.execPromise(a).then(v=>{
        assert.fail("expected error / rejected promise, but got response: " + v);
      }, e=>{
        if (snippet && e instanceof Error && !e.message.includes(snippet))
         assert.fail(`Got error in promise, but without expected text snippet: "${snippet}". Got message: ${e.message}`);
        return Promise.resolve(e);
      });
    }
    catch (e) {
      // thrown error also passes
      if (snippet && e instanceof Error && !e.message.includes(snippet))
        assert.fail(`Got error (as exception), but without expected text snippet: "${snippet}". Got message: ${e.message}`);
      return Promise.resolve(e);
    }
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

class JelPromise extends NativeJelObject {
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
  get clazz() {
    return JelPromise.clazz;
  }
}
JelPromise.create_jel_mapping = true;
JelPromise.resolve_jel_mapping = true;
JelPromise.rnd_jel_mapping = true;
BaseTypeRegistry.register('JelPromise', JelPromise);

class JelConsole extends NativeJelObject {
	static create(ctx, firstValue, ...values) {
		console.log('JelConsole: ', firstValue, ...values);
		return firstValue;
	}
  get clazz() {
    return JelConsole.clazz;
  }
}
JelConsole.create_jel_mapping = true;
BaseTypeRegistry.register('JelConsole', JelConsole);

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
  
  get clazz() {
    return PromiseType.clazz;
  }

  static create(ctx, ...args) {
    return new PromiseType(args[0]);
  }
}
PromiseType.create_jel_mapping = true;
BaseTypeRegistry.register('PromiseType', PromiseType);

function plus(ctx) {
  return JEL.execute(`{
  JelPromise: (native class JelPromise: native constructor(value) static native rnd(value) static native resolve(value)),
  JelConsole: (native class JelConsole: native constructor(firstValue, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)),
  PromiseType: (native class PromiseType: native constructor(e))
}`, `jel-assert.js inline`, ctx).then(r=>{
    JelPromise.clazz = r.elements.get('JelPromise');
    JelConsole.clazz = r.elements.get('JelConsole');
    PromiseType.clazz = r.elements.get('PromiseType');
    return ctx.plus({JelPromise: r.elements.get('JelPromise'), JelConsole: r.elements.get('JelConsole'), PromiseType: r.elements.get('PromiseType')});
  });
}

module.exports = {JelAssert, MockSession, plus, JelPromise};

