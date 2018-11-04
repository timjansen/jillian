import JelObject from '../JelObject';
import Runtime from '../Runtime';
import SerializablePrimitive from '../SerializablePrimitive';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Context from '../Context';
import JelNumber from './JelNumber';
import JelString from './JelString';
import List from './List';
import JelBoolean from './JelBoolean';
import Callable from '../Callable';

/**
 * Dictionary is a map-like type for JEL.
 */
export default class Dictionary extends JelObject implements SerializablePrimitive {
	elements: Map<string, JelObject|null>;
	
	JEL_PROPERTIES: Object;
	static readonly JEL_PROPERTIES = {empty: true};
	static readonly empty = new Dictionary();
	
	constructor(elements: any = [], keepMap = false) {
		super();
		if (keepMap)
			this.elements = elements;
		else {
			this.elements = new Map();
			this.putAll(elements);
		}
	}
	
	op(ctx: Context, operator: string, right: JelObject): JelObject|Promise<JelObject> {
		if (right == null)
			return this;
		if (right instanceof Dictionary) {
			switch(operator) {
				case '==':
				case '===':
					if (this.elements.size != right.elements.size)
						return JelBoolean.FALSE;
					let result: JelBoolean | Promise<JelBoolean> = JelBoolean.TRUE;
					for (let key of this.elements.keys())
						if (!right.elements.has(key))
							return JelBoolean.FALSE;
						else
							result = JelBoolean.falsestWithPromises(ctx, result, Runtime.op(ctx, operator, this.elements.get(key) as JelObject, right.elements.get(key) as JelObject) as any);
					return result;
			}
		}
		return super.op(ctx, operator, right);
	}
	
	singleOp(ctx: Context, operator: string): JelObject|Promise<JelObject> {
		if (operator == '!')
			return JelBoolean.valueOf(!this.elements.size);
		else
			return super.singleOp(ctx, operator);
	}

	
	get_jel_mapping: Object;
	get(ctx: Context, key: JelString | string): any {
		if (key instanceof JelString)
			return this.get(ctx, key.value);
		else if (typeof key != 'string')
			throw new Error('Key must be string');
		const v = this.elements.get(key);
		return v == undefined ? null : v;
	}

	has_jel_mapping: Object;
	has(ctx: Context, key: JelString | string): JelBoolean {
		if (key instanceof JelString)
			return this.has(ctx, key.value);
		else if (typeof key != 'string')
			throw new Error('Key must be string');
		return JelBoolean.valueOf(this.elements.has(key));
	}

	set(key: JelString | string, value: JelObject|null): Dictionary {
		if (key instanceof JelString)
			return this.set(key.value, value);
		else if (typeof key != 'string')
			throw new Error('Key must be string');
		
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
				this.elements.set(otherDict[i] instanceof JelString ? otherDict[i].value : '', otherDict[i+1]);
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
	
	get anyKey(): string | null {
		if (this.elements.size)
			return this.elements.keys().next().value;
		else
			return null;
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
				const r = f.invoke(ctx, JelString.valueOf(next.value), self.elements.get(next.value), JelNumber.valueOf(i));
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
				const r = f.invoke(ctx, JelString.valueOf(next.value), self.elements.get(next.value), JelNumber.valueOf(i));
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

	jsEach(f: (k: string, v: JelObject|null, i: number)=>any): Dictionary {
		const self = this;
		const newDict = new Dictionary();
		let i = 0;
		const it = this.elements.keys();
		while (true) {
			const next = it.next();
			if (next.done)
				return newDict;
			 f(next.value, this.elements.get(next.value) as JelObject|null, i++);
		}
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
				const thisValue = self.elements.get(next.value) as JelObject;
				const r = f.invoke(ctx, JelString.valueOf(next.value), thisValue, JelNumber.valueOf(i));
				i++;
				if (r instanceof Promise)
					return r.then(v=> {
						if (JelBoolean.toRealBoolean(v))
							newDict.set(next.value, thisValue);
						return exec();
					});
				else if (JelBoolean.toRealBoolean(r))
					newDict.set(next.value, thisValue);
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
				const r = f.invoke(ctx, result, JelString.valueOf(next.value), self.elements.get(next.value), JelNumber.valueOf(i));
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
	hasAny(ctx: Context, f: Callable): JelBoolean | Promise<JelBoolean> {
		const self = this;
		let i = 0;
		const it = this.elements.keys();
		function exec(): Promise<JelBoolean> | JelBoolean {
			while (true) {
				const next = it.next();
				if (next.done)
					return JelBoolean.FALSE;
				const r = f.invoke(ctx, JelString.valueOf(next.value), self.elements.get(next.value), JelNumber.valueOf(i));
				i++;
				if (r instanceof Promise)
					return r.then(v=> v.toRealBoolean() ? JelBoolean.TRUE : exec());
				else if (r.toRealBoolean())
					return JelBoolean.TRUE;
			}
		}
		return exec();
	}

	hasOnly_jel_mapping: Object;
	hasOnly(ctx: Context, f: Callable): JelBoolean | Promise<JelBoolean> {
		const self = this;
		let i = 0;
		const it = this.elements.keys();
		function exec(): Promise<JelBoolean> | JelBoolean {
			while (true) {
				const next = it.next();
				if (next.done)
					return JelBoolean.TRUE;
				const r = f.invoke(ctx, JelString.valueOf(next.value), self.elements.get(next.value), JelNumber.valueOf(i));
				i++;
				if (r instanceof Promise)
					return r.then(v=> v.toRealBoolean() ? exec() : JelBoolean.FALSE);
				else if (!r.toRealBoolean())
					return JelBoolean.FALSE;
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

	serializeToString(pretty: boolean, indent: number, spaces: string, serializer: (object: any, pretty: boolean, indent: number, spaces: string)=>string): string | undefined {
		if (!this.size)
			return "{}";
		let r = '{';
		let i = 0;
		const last = this.elements.size-1;
		this.elements.forEach((value, key) => {
			if (pretty)
				r += '\n'+spaces.substr(0, 2);
			if (typeof key == 'string' && /^[a-zA-Z_]\w*$/.test(key))
				r += key;
			else
				r += serializer(key, pretty, indent,spaces);
			r += (pretty ? ': ' : ':') + serializer(value, pretty, indent, spaces);
			if (i++ < last)
				r += pretty ? ', ' : ',';
		});
		if (pretty)
			r += '\n';
		return r + '}';
	}

	static valueOf(data: Map<string, any>, keepMap = false): Dictionary {
		return new Dictionary(data, keepMap);
	}
	
	static create_jel_mapping = {list: 1}; // 2nd ctor argument intentionally omittted!
	static create(ctx: Context, ...args: any[]): any {
		return new Dictionary(args[0]);  // 2nd ctor argument intentionally omittted! They are not intended for JEL.
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

BaseTypeRegistry.register('Dictionary', Dictionary);
