'use strict';

const JelType = require('../type.js');

/**
 * Represents a node in a JEL expression.
 */
class JelNode extends JelType {
	// Returns either a value or a Promise for a value!
	execute(ctx) {
		throw new Error(`execute() not implemented in ${this.constructor.name}`);
	}
	
	equals(other) {
		throw new Error(`equals() not implemented in ${this.constructor.name}`);
	}
	
	// Returns always Promise for a value!
	executePromise(ctx) {
		const r = this.execute(ctx);
		if (r instanceof Promise)
			return r;
		else
			return Promise.resolve(r);
	}

	resolveValue(ctx, f, value) {
		if (value instanceof Promise)
			return value.then(f);
		else
			return f(value);
	}

	resolveValues(ctx, f, ...values) {
		if (!values.length)
			return f();
		
		if (values.find(v=>v instanceof Promise))
			return Promise.all(values).then(v=>f(...v));
		else 
			return f(...values);
	}

	resolveValueObj(ctx, f, assignments, values) {
		if (!assignments.length)
			return f(null);
		
		function createObj(l) {
			const o = {};
			l.forEach((v, i)=>o[assignments[i].name] = v);
			return o;
		}
		
		if (values.find(v=>v instanceof Promise))
			return Promise.all(values).then(v=>f(createObj(v)));
		else 
			return f(createObj(values));
	}

}

module.exports = JelNode;
