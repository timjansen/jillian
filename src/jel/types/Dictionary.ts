import JelType from '../JelType';
import Context from '../Context';
import List from './List';
import FuzzyBoolean from './FuzzyBoolean';
import Callable from '../Callable';
import Gettable from '../Gettable';

/**
 * Dictionary is a map-like type for JEL.
 */
export default class Dictionary extends JelType {
	elements: Map<any, any>;
	
	JEL_PROPERTIES: Object;
	static readonly JEL_PROPERTIES = {empty: true};
	static readonly empty = new Dictionary();
	
	constructor(elements: any = [], useProvidedMap = false) {
		super();
		if (useProvidedMap)
			this.elements = elements;
		else {
			this.elements = new Map();
			this.putAll(elements);
		}
	}
	
	op(ctx: Context, operator: string, right: any): any {
		if (right == null)
			return this;
		if (right instanceof Dictionary) {
			switch(operator) {
				case '==':
				case '===':
					if (this.elements.size != right.elements.size)
						return FuzzyBoolean.FALSE;
					let result: FuzzyBoolean | Promise<FuzzyBoolean> = FuzzyBoolean.TRUE;
					for (let key of this.elements.keys())
						if (!right.elements.has(key))
							return FuzzyBoolean.FALSE;
						else
							result = FuzzyBoolean.falsestWithPromises(ctx, result, JelType.op(ctx, operator, this.elements.get(key), right.elements.get(key)));
					return result;
			}
		}
		return super.op(ctx, operator, right);
	}
	
	singleOp(ctx: Context, operator: string): any {
		if (operator == '!')
			return FuzzyBoolean.toFuzzyBoolean(!this.elements.size);
		else
			return super.singleOp(ctx, operator);
	}

	
	get_jel_mapping: Object;
	get(ctx: Context, key: any): any {
		return this.elements.get(key);
	}

	has_jel_mapping: Object;
	has(ctx: Context, key: any): FuzzyBoolean {
		return FuzzyBoolean.toFuzzyBoolean(this.elements.has(key));
	}

	set(key: any, value: any): Dictionary {
		this.elements.set(key, value);
		return this;
	}

	putAll(otherDict: any): Dictionary {
		if (!otherDict)
			return this;
		
		if (otherDict instanceof Map) {
			for (let key of otherDict.keys())
				this.elements.set(key, otherDict.get(key));
		}
		else if (otherDict instanceof Dictionary) {
			this.putAll(otherDict.elements);
		}
		else if (Array.isArray(otherDict)) {
			for (let i = 0; i < otherDict.length-1; i+=2)
				this.elements.set(otherDict[i], otherDict[i+1]);
		}
		else if (otherDict instanceof List) {
			this.putAll(otherDict.elements);
		}
		else if (typeof otherDict == 'object') {
			for (let key in otherDict)
				this.elements.set(key, otherDict[key]);
		}
		return this;
	}
	
	get anyKey(): any {
		return this.elements.keys().next().value;
	}
	
	get size(): number {
		return this.elements.size;
	}

	get keys(): List {
		return new List(this.elements.keys());
	}

	each_jel_mapping: Object;
	each(ctx: Context, f: Callable): Dictionary | Promise<Dictionary> {
		const self = this;
		let i = 0;
		const it = this.elements.keys();
		function exec(): Promise<Dictionary> | Dictionary {
			while (true) {
				const next = it.next();
				if (next.done)
					return self;
				const r = f.invoke(ctx, next.value, self.elements.get(next.value), i);
				i++;
				if (r instanceof Promise)
					return r.then(exec);
			}
		}
		return exec();
	}

	map_jel_mapping: Object;
	map(ctx: Context, f: Callable): Dictionary | Promise<Dictionary> {
		const self = this;
		const newDict = new Dictionary();
		let i = 0;
		const it = this.elements.keys();
		function exec(): Promise<Dictionary> | Dictionary {
			while (true) {
				const next = it.next();
				if (next.done)
					return newDict;
				const r = f.invoke(ctx, next.value, self.elements.get(next.value), i);
				i++;
				if (r instanceof Promise)
					return r.then(v=> {
						newDict.set(next.value, v);
						return exec();
					});
				else
					newDict.set(next.value, r);
			}
		}
		return exec();
	}

	filter_jel_mapping: Object;
	filter(ctx: Context, f: Callable): Dictionary | Promise<Dictionary> {
		const self = this;
		const newDict = new Dictionary();
		let i = 0;
		const it = this.elements.keys();
		function exec(): Promise<Dictionary> | Dictionary {
			while (true) {
				const next = it.next();
				if (next.done)
					return newDict;
				const r = f.invoke(ctx, next.value, self.elements.get(next.value), i);
				i++;
				if (r instanceof Promise)
					return r.then(v=> {
						if (JelType.toRealBoolean(v))
							newDict.set(next.value, self.elements.get(next.value));
						return exec();
					});
				else if (JelType.toRealBoolean(r))
					newDict.set(next.value, self.elements.get(next.value));
			}
		}
		return exec();
	}
	
	reduce_jel_mapping: Object;
	reduce(ctx: Context, f: Callable, init: any = 0): any {
		const self = this;
		let result: any = init;
		let i = 0;
		const it = this.elements.keys();
		function exec(): Promise<Dictionary> | Dictionary {
			while (true) {
				const next = it.next();
				if (next.done)
					return result;
				const r = f.invoke(ctx, result, next.value, self.elements.get(next.value), i);
				i++;
				if (r instanceof Promise)
					return r.then(v=> {
						result = v;
						return exec();
					});
				else 
					result = r;
			}
			return result;
		}
		return exec();
	}

	hasAny_jel_mapping: Object;
	hasAny(ctx: Context, f: Callable): FuzzyBoolean | Promise<FuzzyBoolean> {
		const self = this;
		let i = 0;
		const it = this.elements.keys();
		function exec(): Promise<FuzzyBoolean> | FuzzyBoolean {
			while (true) {
				const next = it.next();
				if (next.done)
					return FuzzyBoolean.FALSE;
				const r = f.invoke(ctx, next.value, self.elements.get(next.value), i);
				i++;
				if (r instanceof Promise)
					return r.then(v=> v.toRealBoolean() ? FuzzyBoolean.TRUE : exec());
				else if (r.toRealBoolean())
					return FuzzyBoolean.TRUE;
			}
		}
		return exec();
	}

	hasOnly_jel_mapping: Object;
	hasOnly(ctx: Context, f: Callable): FuzzyBoolean | Promise<FuzzyBoolean> {
		const self = this;
		let i = 0;
		const it = this.elements.keys();
		function exec(): Promise<FuzzyBoolean> | FuzzyBoolean {
			while (true) {
				const next = it.next();
				if (next.done)
					return FuzzyBoolean.TRUE;
				const r = f.invoke(ctx, next.value, self.elements.get(next.value), i);
				i++;
				if (r instanceof Promise)
					return r.then(v=> v.toRealBoolean() ? exec() : FuzzyBoolean.FALSE);
				else if (!r.toRealBoolean())
					return FuzzyBoolean.FALSE;
			}
		}
		return exec();
	}

	toObjectDebug(): any {
		const o: any = {};
		this.elements.forEach((value, key) => o[key] = value);
		return o;
	}
	
	static fromObject(o: any): Dictionary {
		return new Dictionary(new Map(Object.keys(o).map(k => [k, o[k]]) as any), true);
	}

	static create_jel_mapping = {list: 1}; // 2nd argument intentionally omittted!
	static create(ctx: Context, ...args: any[]): any {
		return new Dictionary(args[0]);  // 2nd argument intentionally omittted! They are not intended for JEL.
	}
}


Dictionary.prototype.JEL_PROPERTIES = {size: true, anyKey: true, keys: true};
Dictionary.prototype.get_jel_mapping = {key: 1};
Dictionary.prototype.has_jel_mapping = {key: 1};
Dictionary.prototype.each_jel_mapping = {f: 1};
Dictionary.prototype.map_jel_mapping = {f: 1};
Dictionary.prototype.filter_jel_mapping = {f: 1};
Dictionary.prototype.reduce_jel_mapping = {f: 1, init: 2};
Dictionary.prototype.hasAny_jel_mapping = {f: 1};
Dictionary.prototype.hasOnly_jel_mapping = {f: 1};

		