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
					let result = FuzzyBoolean.TRUE;
					for (let key of this.elements.keys())
						if (!right.elements.has(key))
							return FuzzyBoolean.FALSE;
						else {
							result = FuzzyBoolean.falsest(ctx, result, JelType.op(ctx, operator, this.elements.get(key), right.elements.get(key)));
							if (result.isClearlyFalse())
								return result;
						}
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
	each(ctx: Context, f: Callable | ((key: string, value: any, index: number)=>void)): Dictionary {
		let i = 0;
		if (typeof f == 'function')
			this.elements.forEach((value, key) => f(key, value, i++));
		else
			this.elements.forEach((value, key) => f.invoke(ctx, key, value, i++));
		return this;
	}

	map_jel_mapping: Object;
	map(ctx: Context, f: Callable): Dictionary {
		let i = 0;
		const d = new Dictionary();
		this.elements.forEach((value, key) => d.elements.set(key, f.invoke(ctx, key, value, i++)));
		return d;
	}

	filter_jel_mapping: Object;
	filter(ctx: Context, f: Callable): Dictionary {
		let i = 0;
		const d = new Dictionary();
		this.elements.forEach((value, key) => {
			if (JelType.toRealBoolean(f.invoke(ctx, key, value, i++)))
				d.elements.set(key, value);
		});
		return d;
	}
	
	reduce_jel_mapping: Object;
	reduce(ctx: Context, f: Callable, init: any = 0): any {
		let i = 0;
		let a = init;
		for (let key of this.elements.keys())
			a = f.invoke(ctx, a, key, this.elements.get(key), i++);
		return a;
	}

	hasAny_jel_mapping: Object;
	hasAny(ctx: Context, f: Callable): FuzzyBoolean {
		let i = 0;
		for (let key of this.elements.keys()) {
			const value = this.elements.get(key);
			if (JelType.toRealBoolean(f.invoke(ctx, key, value)))
				return FuzzyBoolean.TRUE;
		}
		return FuzzyBoolean.FALSE;
	}

	hasOnly_jel_mapping: Object;
	hasOnly(ctx: Context, f: Callable): FuzzyBoolean {
		let i = 0;
		for (let key of this.elements.keys()) {
			const value = this.elements.get(key);
			if (!JelType.toRealBoolean(f.invoke(ctx, key, value)))
				return FuzzyBoolean.FALSE;
		}
		return FuzzyBoolean.TRUE;
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

		