

export default class Util {
	
	// takes in nested array or value, adds to target.
	static addRecursively(src: any, target: any[]): any[] {
		if (Array.isArray(src))
			for (const a of src)
				Util.addRecursively(a, target);
		else if (src != null)
			target.push(src);
		return target;
	}

	// takes a nested array or null, and returns the non-null values in a single array
	static flattenToArray(a: any): any[] {
		if (Array.isArray(a))
			return Util.addRecursively(a, []);
		else if (a == null)
			return [];
		else
			return [a];
	}

	static collect(list: any[], f: (e: any)=>any): any[] {
		const r = [];
		if (!Array.isArray(list))
			throw new Error("collect argument must be array, but was "+list);
		for (const l of list) {
			const fr = f(l);
			if (Array.isArray(fr))
				r.push.apply(r, fr);
			else if (fr != null)
				r.push(fr);
		}
		return r;		
	}

	static has(array: any[], testFunc: (e: any, i: number)=>boolean): boolean {
		return array.findIndex(testFunc) > -1;
	}

	static hasRecursive(nestedArray: any[], testFunc: (e: any)=>boolean): boolean {
		return nestedArray.findIndex(a=>Array.isArray(a) ? Util.hasRecursive(a, testFunc) : testFunc(a)) > -1;
	}

	
	// adds src to dest, returning an array if necessary. src and dest can be null which represents an empty list. Returns the result.
	static addToArray(dest: any, src: any): any {
		if (src == null)
			return dest;
		if (dest == null)
			return Array.isArray(src) ? Array.from(src) : [src];

		const d = Array.isArray(dest) ? dest : [dest];
				
		if (Array.isArray(src))
			d.push.apply(dest, src);
		else
			d.push(src);
		return d;
	}
	
	static propertyNames(obj: Object): Array<string> {
		const r = [];
		for (const name in obj)
			if (obj.hasOwnProperty(name))
				r.push(name);
		return r;
	}
	
	static resolveValue(f: (e: any)=>any, value: any): any {
		if (value instanceof Promise)
			return value.then(f);
		else
			return f(value);
	}

	static resolveValues(f: Function, ...values: any[]): any {
		if (!values.length)
			return f();
		
		if (values.find(v=>v instanceof Promise))
			return Promise.all(values).then(v=>f(...v));
		else 
			return f(...values);
	}
	

	
	// resolves a mixture of promises, nested arrays and non-arrays. Calls the callback for each non-null value, and returns either a flat array of values,
	// or a promise returning such an array, or undefined as replacement for empty arrays.
	static resolveNestedValues(values: any, f: (e: any)=>any): any {
		if (values == null)
			return values;
		else if (values instanceof Promise) 
			return values.then(p=>Util.resolveNestedValues(p, f));
		else if (Array.isArray(values)) {
			const flattened = Util.flattenToArray(values);
			if (Util.has(flattened, p=>p instanceof Promise))
					return Promise.all(flattened).then(p1=>Util.resolveNestedValues(p1, f));
			return flattened.length ? Util.collect(flattened, a=>a!=null ? f(a) : undefined) : undefined;
		}
		else
			return f(values);
	}
	
	// takes a promise, or list of promises and non-promises, or any combination thereof. Always returns a promise that contains an array.
	static simplifyPromiseArray(p: any): Promise<any> {
		if (p instanceof Promise) 
			return p.then(p0=>Util.simplifyPromiseArray(p0));
		else if (Array.isArray(p)) {
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
