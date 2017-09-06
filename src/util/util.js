'use strict';


class Util {
	static isArrayLike(t) {
		return t && t.length !== undefined && typeof t == 'object';
	}
	
	// takes in nested array or value, adds to target.
	static addRecursively(src, target) {
		if (Util.isArrayLike(src))
			for (const a of src)
				Util.addRecursively(a, target);
		else if (src != null)
			target.push(src);
		return target;
	}

	// takes a nested array or null, and returns the non-null values in a single array
	static flattenToArray(a) {
		if (Util.isArrayLike(a))
			return Util.addRecursively(a, []);
		else if (a == null)
			return [];
		else
			return [a];
	}

	static collect(list, f) {
		const r = [];
		if (!Util.isArrayLike(list))
			throw new Error("collect argument must be iterable, but was "+list);
		for (const l of list) {
			const fr = f(l);
			if (Util.isArrayLike(fr))
				r.push.apply(r, fr);
			else if (fr != null)
				r.push(fr);
		}
		return r;		
	}

	static has(array, testFunc) {
		return array.findIndex(testFunc) > -1;
	}

	static hasRecursive(nestedArray, testFunc) {
		return nestedArray.findIndex(a=>Util.isArrayLike(a) ? Util.hasRecursive(a, testFunc) : testFunc(a)) > -1;
	}

	
	// adds src to dest, returning an array if necessary. src and dest can be null which represents an empty list. Returns the result.
	static addToArray(dest, src) {
		if (src == null)
			return dest;
		if (dest == null)
			return Util.isArrayLike(src) ? Array.from(src) : [src];

		const d = Util.isArrayLike(dest) ? dest : [dest];
				
		if (Util.isArrayLike(src))
			d.push.apply(dest, src);
		else
			d.push(src);
		return d;
	}
	
	static propertyNames(obj) {
		const r = [];
		for (const name in obj)
			if (obj.hasOwnProperty(name))
				r.push(name);
		return r;
	}
	
	static resolveValue(f, value) {
		if (value instanceof Promise)
			return value.then(f);
		else
			return f(value);
	}

	static resolveValues(f, ...values) {
		if (!values.length)
			return f();
		
		if (values.find(v=>v instanceof Promise))
			return Promise.all(values).then(v=>f(...v));
		else 
			return f(...values);
	}
	
	static resolveValueObj(f, assignments, values) {
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
	
	// resolves a mixture of promises, nested arrays and non-arrays. Calls the callback for each non-null value, and returns either a flat array of values,
	// or a promise returning such an array, or undefined as replacement for empty arrays.
	static resolveNestedValues(values, f) {
		if (values == null)
			return values;
		else if (values instanceof Promise) 
			return values.then(p=>Util.resolveNestedValues(p, f));
		else if (Util.isArrayLike(values)) {
			const flattened = Util.flattenToArray(values);
			if (Util.has(flattened, p=>p instanceof Promise))
					return Promise.all(flattened).then(p1=>Util.resolveNestedValues(p1, f));
			return flattened.length ? Util.collect(flattened, a=>a!=null ? f(a) : undefined) : undefined;
		}
		else
			return f(values);
	}
	
	// takes a promise, or list of promises and non-promises, or any combination thereof. Always returns a promise that contains an array.
	static simplifyPromiseArray(p) {
		if (p instanceof Promise) 
			return p.then(p0=>Util.simplifyPromiseArray(p0));
		else if (Util.isArrayLike(p)) {
			const flattened = Util.flattenToArray(p);
			if (Util.has(flattened, p=>p instanceof Promise))
					return Promise.all(flattened).then(p1=>Util.simplifyPromiseArray(p1));
			else
				return Promise.resolve(flattened);
		}
		else
			return Promise.resolve([p]);
	}
}

module.exports = Util;
