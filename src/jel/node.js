'use strict';

const JelType = require('./type.js');
const LazyRef = require('./lazyref.js');

/**
 * Represents a node in a JEL expression.
 */
class JelNode extends JelType {
	// Returns either a value or a Promise for a value!
	execute(ctx) {
		throw new Error(`execute() not implemented in ${this.constructor.name}`);
	}

	// Returns always Promise for a value!
	executePromise(ctx) {
		const r = this.execute(ctx);
		if (r instanceof Promise)
			return r;
		else
			return new Promise(resolve=>resolve(r));
	}

	resolveValue(ctx, f, value) {
		if (value instanceof Promise)
			return value.then(f);
		else if (value instanceof LazyRef)
			return this.resolveValue(ctx, f, value.get(ctx));
		else
			return f(value);
	}

	resolveValues(ctx, f, ...values) {
		if (!values.length)
			return f();
		
		const noLazy = values.map(v=>(v instanceof LazyRef) ? v.get(ctx) : v);
		if (noLazy.find(v=>v instanceof Promise))
			return Promise.all(noLazy).then(v=>f(...v));
		else 
			return f(...noLazy);
	}

	resolveValueObj(ctx, f, assignments, values) {
		if (!assignments.length)
			return f(null);
		
		const noLazy = values.map(v=>v instanceof LazyRef ? v.get(ctx) : v);
		
		function createObj(l) {
			const o = {};
			l.forEach((v, i)=>o[assignments[i].name] = v);
			return o;
		}
		
		if (noLazy.find(v=>v instanceof Promise))
			return Promise.all(noLazy).then(v=>f(createObj(v)));
		else 
			return f(createObj(noLazy));
	}

}

module.exports = JelNode;
