

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
		const r: any[] = [];
		if (!Array.isArray(list))
			throw new Error("collect argument must be array, but was "+list);
		for (const l of list) {
			const fr = f(l);
			if (Array.isArray(fr))
				r.push(...fr);
			else if (fr != null)
				r.push(fr);
		}
		return r;		
	}

	static hasAny(array: any[], testFunc: (e: any, i: number)=>boolean): boolean {
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
		const r: string[] = [];
		for (const name in obj)
			if (obj.hasOwnProperty(name))
				r.push(name);
		return r;
	}
	
	static toMap(obj: Object): Map<string, any> {
		const r = new Map<string, any>();
		for (const name in obj) 
			r.set(name, (obj as any)[name]);
		return r;
	}
	
	static resolveValue(value: any, f: (e: any)=>any): any {
		if (value instanceof Promise)
			return value.then(f);
		else
			return f(value);
	}

	static resolveValueAndError(value: any, f: (e: any)=>any, err: any): any {
		if (value instanceof Promise)
			return value.then(f, err);
		else 
			try {
				return f(value);
			}
			catch (e) {
				return Promise.reject(e);
			}
	}

	static resolveValues(f: Function, ...values: any[]): any {
		if (!values.length) 
			try {
				return f();
			}
			catch (e) {
				return Promise.reject(e);
			}
		
		if (values.find(v=>v instanceof Promise))
			return Promise.all(values).then(v=>f(...v));
		else  
			try {
				return f(...values);
			}
			catch (e) {
				return Promise.reject(e);
			}
	}

	static resolveArray(arr: any[], f: (a: any[])=>any): any {
		if (arr.find(v=>v instanceof Promise))
			return Promise.all(arr).then(f);
		else  
			try {
				return f(arr);
			}
			catch (e) {
				return Promise.reject(e);
			}
	}
	
	/**
	 * Helper to invoke a function promiseGenerator for every element of an array, in which the function may return a Promise or not.
	 * promiseProcessor is called when promiseGenerator's return value is available (thus either immediately or when the Promise resolved).
	 * If promiseProcessor returns a value other than undefined, processing the list is aborted.
	 * When either all list elements have been processed, or promiseProcessor returned a non-undefined value, the optional resultGenerator can
	 * be called. Its parameter is either the value returned by promiseProcessor, or undefined if list processing has not been aborted.
	 * The processPromiseList returns the return value of resultGenerator, if given, or the value returned by promiseProcessor if it returned something,
	 * or undefined. If any promiseGenerator invokation returned a Promise, the return value is wrapped in a Promise.
	 */
	static processPromiseList(list: any[], promiseGenerator: (listValue: any, step: number)=>any|Promise<any>, 
														promiseProcessor: (generatedValue: any, listValue: any, step: number)=>void,
														resultGenerator?: (processorResult: any)=>any): any| Promise<any> {
		let i = 0;
		const len = list.length;
		function exec(): Promise<any> | any {
			while (i < len) {
				const e = list[i];
				const r = promiseGenerator(e, i);
				if (r instanceof Promise)
					return r.then(v=>{
						const p = promiseProcessor(v, e, i);
						i++;
						if (p === undefined)
							return exec();
						else
							return p;
					});
				else {
					const p = promiseProcessor(r, e, i);
					i++;
					if (p !== undefined)
						return p;
				}
			}
		}
		
		if (resultGenerator)
			return Util.resolveValue(exec(), resultGenerator);
		else
			return exec();
	}
	
	/**
	 * Process a series of functions on an array, while making sure that any Promises in the array have been
	 * resolved before calling the next function. 
	 * It takes the input array, waits for any promise in the array to resolve, replaces the promise with the
	 * actual value, and then calls the first processor with on all values that are not undefined. The return values of
	 * the first processor will be put into an array. If the processor returns undefined, the entry will not be added to the result array.
	 * If the processor returns an array, all elements will be put into the result array.
	 * The resulting array will then be used as input for the second function,  then it runs the third function and so on,
	 * until either all functions have been executed, or the array becomes empty. 
	 * The function returns either an array of the last function's return values (if no Promises were in any array), or
	 * a promise to such an array.
	 */
	static promisePipeline(inputArray: any[], ...processors: ((input: any)=>any)[]): any[] | Promise<any[]> {
		function processStep(inputArray: any[], processor: (input: any)=>any): any[] | Promise<any[]> {
			if (inputArray.find(v=>v instanceof Promise))
				return Promise.all(inputArray).then(na=>Util.collect(na, processor));
			else
				return Util.collect(inputArray, processor);
		}
		
		let a = inputArray;
		return Util.processPromiseList(processors.concat((x: any)=>x), proc=>processStep(a, proc), newA=>{a = newA; return;}, x=>a);
	}

	static catchValue(value: any, f: (e: any)=>any): any {
		if (value instanceof Promise)
			return value.catch(f);
		else
			return value;
	}
	
	static resolveInvoke(obj: any, f: any, ...args: any[]): any {
		return Util.resolveValues((obj: any, f: any, ...args: any[])=>f.apply(obj, args));
	}

	
	static denull<T>(x: T | null | undefined, msg?: string): T {
		if (x == null)
			throw new Error(msg || "Got unsupported null or undefined");
		return x as T;
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
			if (Util.hasAny(flattened, p=>p instanceof Promise))
					return Promise.all(flattened).then(p1=>Util.resolveNestedValues(p1, f));
			return flattened.length ? Util.collect(flattened, a=>a!=null ? f(a) : undefined) : undefined;
		}
		else
			return f(values);
	}
	
	// takes a promise, or list of promises and non-promises, or any combination thereof. Always returns a promise that contains an array.
	static simplifyPromiseArray(p: any): Promise<Array<any>> {
		if (p instanceof Promise) 
			return p.then(p0=>Util.simplifyPromiseArray(p0));
		else if (Array.isArray(p)) {
			const flattened = Util.flattenToArray(p);
			if (Util.hasAny(flattened, p=>p instanceof Promise))
					return Promise.all(flattened).then(p1=>Util.simplifyPromiseArray(p1));
			else
				return Promise.resolve(flattened);
		}
		else
			return Promise.resolve([p]);
	}
}
