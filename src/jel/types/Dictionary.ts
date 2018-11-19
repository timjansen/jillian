import JelObject from '../JelObject';
import Runtime from '../Runtime';
import SerializablePrimitive from '../SerializablePrimitive';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Context from '../Context';
import JelNumber from './JelNumber';
import JelString from './JelString';
import List from './List';
import JelBoolean from './JelBoolean';
import TypeChecker from './TypeChecker';
import Callable from '../Callable';


const LIST_OR_DICTIONARY = ['List', 'Dictionary'];

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
	get(ctx: Context, key0: JelString | string): any {
		const key = TypeChecker.realString(key0, 'key');
		const v = this.elements.get(key);
		return v == undefined ? null : v;
	}

	has_jel_mapping: Object;
	has(ctx: Context, key0: JelString | string): JelBoolean {
		const key = TypeChecker.realString(key0, 'key');
		return JelBoolean.valueOf(this.elements.has(key));
	}

	set(key0: JelString | string, value: JelObject|null): Dictionary {
		const key = TypeChecker.realString(key0, 'key');
		
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

	get empty(): boolean {
		return this.elements.size == 0;
	}

	get keys(): List {
		return new List(this.elements.keys());
	}

	each_jel_mapping: Object;
	each(ctx: Context, f0: any): Dictionary | Promise<Dictionary> {
		const f: Callable = TypeChecker.instance(Callable, f0, 'f');
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
	map(ctx: Context, f0: any): Dictionary | Promise<Dictionary> {
		const f: Callable = TypeChecker.instance(Callable, f0, 'f');
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
	filter(ctx: Context, f0: any): Dictionary | Promise<Dictionary> {
		const f: Callable = TypeChecker.instance(Callable, f0, 'f');
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

 	filterJs(f: (key: string, value: JelObject|null)=>JelObject|null): Dictionary {
		const newDict = new Dictionary();
		for (let key of this.elements.keys()) {
      const value = (this.elements.get(key)||null) as JelObject|null;
      newDict.set(key, f(key, value));
    }
    return newDict;
	}
  
	reduce_jel_mapping: Object;
	reduce(ctx: Context, f0: any, init: any = 0): any {
		const f: Callable = TypeChecker.instance(Callable, f0, 'f');

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
	hasAny(ctx: Context, f0: any): JelBoolean | Promise<JelBoolean> {
		const f: Callable = TypeChecker.instance(Callable, f0, 'f');
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

	hasAnyJs(f: (k: string, v: JelObject|null)=>boolean): boolean {
    for (let key of this.elements.keys())
      if (f(key, this.elements.get(key) || null))
        return true;
    return false;
	}

  
	hasOnly_jel_mapping: Object;
	hasOnly(ctx: Context, f0: any): JelBoolean | Promise<JelBoolean> {
		const f: Callable = TypeChecker.instance(Callable, f0, 'f');

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

 	hasOnlyJs(f: (k: string, v: JelObject|null)=>boolean): boolean {
    for (let key of this.elements.keys())
      if (!f(key, this.elements.get(key) || null))
        return false;
    return true;
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


Dictionary.prototype.JEL_PROPERTIES = {size: true, anyKey: true, keys: true, empty: true};
Dictionary.prototype.get_jel_mapping = {key: 1};
Dictionary.prototype.has_jel_mapping = {key: 1};
Dictionary.prototype.each_jel_mapping = {f: 1};
Dictionary.prototype.map_jel_mapping = {f: 1};
Dictionary.prototype.filter_jel_mapping = {f: 1};
Dictionary.prototype.reduce_jel_mapping = {f: 1, init: 2};
Dictionary.prototype.hasAny_jel_mapping = {f: 1};
Dictionary.prototype.hasOnly_jel_mapping = {f: 1};

BaseTypeRegistry.register('Dictionary', Dictionary);
