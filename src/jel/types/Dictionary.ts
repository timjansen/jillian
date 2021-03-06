import JelObject from '../JelObject';
import Runtime from '../Runtime';
import SerializablePrimitive from '../SerializablePrimitive';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Context from '../Context';
import Float from './Float';
import JelString from './JelString';
import List from './List';
import NativeJelObject from './NativeJelObject';
import Class from './Class';
import JelBoolean from './JelBoolean';
import TypeChecker from './TypeChecker';
import Callable from '../Callable';
import Util from '../../util/Util';


const LIST_OR_DICTIONARY = ['List', 'Dictionary'];

/**
 * Dictionary is a map-like type for JEL.
 */
export default class Dictionary extends NativeJelObject implements SerializablePrimitive {
	elements: Map<string, JelObject|null>;
  
  static clazz: Class|undefined;

  
	static readonly empty_jel_property = true;
	static readonly empty = new Dictionary();
  
  defaultValue_jel_property: boolean;

	
	constructor(elements?: any, keepMap = false, public defaultValue: JelObject|null = null) {
		super('Dictionary');
		if (keepMap && elements)
			this.elements = elements;
		else {
			this.elements = new Map();
			this.putAll(elements);
		}
	}

  get clazz(): Class {
    return Dictionary.clazz!;
  }
  
  static fromArray_jel_mapping = true;
  static fromArray(ctx: Context, keys: List, value: any) {
    const d = new Map();
    for (let key of keys.elements) 
      d.set(TypeChecker.realString(key, 'keys'), value);
    return new Dictionary(d, true);
  }

	
	op(ctx: Context, operator: string, right: JelObject, isReversal: boolean = false): JelObject|Promise<JelObject> {
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
        case '+':
          return this.setAll(ctx, right);
        case '-':
          return this.deleteAll(ctx, right);
			}
		}
		return super.op(ctx, operator, right, isReversal);
	}
	
	singleOp(ctx: Context, operator: string): JelObject|Promise<JelObject> {
		if (operator == '!')
			return JelBoolean.valueOf(!this.elements.size);
		else
			return super.singleOp(ctx, operator);
	}

	
	get_jel_mapping: boolean;
	get(ctx: Context, key0: JelString | string): any {
		const key = TypeChecker.realString(key0, 'key');
		const v = this.elements.get(key);
		return v == undefined ? this.defaultValue : v;
	}
  
  withDefault_jel_mapping: boolean;
  withDefault(ctx: Context, defaultValue: JelObject|null): Dictionary {
    if (this.defaultValue === defaultValue)
      return this;
    return new Dictionary(this.elements, true, defaultValue);
  }
  
  member(ctx: Context, name: string): Promise<JelObject|null>|JelObject|null|undefined {
    const sm = super.member(ctx, name);
    if (sm !== undefined)
      return sm;
		return this.elements.get(name);
	}

	has_jel_mapping: boolean;
	has(ctx: Context, key0: JelString | string): JelBoolean {
		const key = TypeChecker.realString(key0, 'key');
		return JelBoolean.valueOf(this.elements.has(key));
	}

  set_jel_mapping: boolean;
  set(ctx: Context, key0: any, value: JelObject|null): Dictionary {
		const key = TypeChecker.realString(key0, 'key');
		const t = new Dictionary(this, false, this.defaultValue);
		t.elements.set(key, value);
		return t;
	}

  setAll_jel_mapping: boolean;
  setAll(ctx: Context, other0: any): Dictionary {
		const other = TypeChecker.optionalInstance(Dictionary, other0, 'other');
    return this.setAllJs(other);
  }
  
  setAllJs(other?: Dictionary): Dictionary {
    if (!other || other.isEmpty)
      return this;
    else if (this.isEmpty)
      return other;
    else 
      return new Dictionary(this, false, this.defaultValue).putAll(other);
  }

  delete_jel_mapping: boolean;
  delete(ctx: Context, key0: any): Dictionary {
	  const key = TypeChecker.realString(key0, 'key');
    if (!key)
      return this;
    const d = new Dictionary(this, false, this.defaultValue);
    d.elements.delete(key);
    return d;
  }

  
  deleteAll_jel_mapping: boolean;
  deleteAll(ctx: Context, keys0: any): Dictionary {
	  const keys = TypeChecker.types(['Dictionary', 'List'], keys0, 'keys');
    if (this.isEmpty || keys.isEmpty)
      return this;
    const d = new Dictionary(this, false, this.defaultValue);
    if (keys instanceof Dictionary)
      keys.eachJs((key: string)=>d.elements.delete(key));
    else
      keys.elements.forEach((e: JelObject|null)=>d.elements.delete(TypeChecker.realString(e, 'list element')));
    return d;
  }

  
  
  // inline put, for JS only
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
      if (Array.isArray(otherDict[0]))
        for (let i = 0; i < otherDict.length; i++)
          this.elements.set(otherDict[i][0] || '', otherDict[i][1]);
      else
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
	
  anyKey_jel_property: boolean;
	get anyKey(): string | null {
		if (this.elements.size)
			return this.elements.keys().next().value;
		else
			return null;
	}
	
  size_jel_property: boolean;
	get size(): number {
		return this.elements.size;
	}

  isEmpty_jel_property: boolean;
  get isEmpty(): boolean {
		return this.elements.size == 0;
	}

  keys_jel_property: boolean;
	get keys(): List {
		return new List(Array.from(this.elements.keys()).map(e=>JelString.valueOf(e)));
	}

	map_jel_mapping: boolean;
	map(ctx: Context, f0: any): Dictionary | Promise<Dictionary> {
		const f: Callable = TypeChecker.instance(Callable, f0, 'f');
    if (this.isEmpty)
      return this;
    
		const self = this;
		const newDict = new Dictionary(undefined, false, this.defaultValue);
		let i = 0;
		const it = this.elements.keys();
		function exec(): Promise<Dictionary> | Dictionary {
			while (true) {
				const next = it.next();
				if (next.done)
					return newDict;
				const r = f.invoke(undefined, JelString.valueOf(next.value), self.elements.get(next.value) || null, Float.valueOf(i));
				i++;
				if (r instanceof Promise)
					return r.then(v=> {
						newDict.elements.set(next.value, v);
						return exec();
					});
				else
					newDict.elements.set(next.value, r);
			}
		}
		return exec();
	}
  
  
	mapWithPromisesJs(f: (k: string, v: JelObject|null)=>JelObject|null|Promise<JelObject|null>): Promise<Dictionary> | Dictionary {
		const self = this;
		const newDict = new Dictionary(undefined, false, this.defaultValue);
		const it = this.elements.keys();
		function exec(): Promise<Dictionary> | Dictionary {
			while (true) {
				const next = it.next();
				if (next.done)
					return newDict;
				const r = f(next.value, self.elements.get(next.value) || null);
				if (r instanceof Promise)
					return r.then(v=> {
						newDict.elements.set(next.value, v);
						return exec();
					});
				else
					newDict.elements.set(next.value, r);
			}
		}
		return exec();
	}

  mapToList_jel_mapping: boolean;
	mapToList(ctx: Context, f0: any): List | Promise<List> {
		const f: Callable = TypeChecker.instance(Callable, f0, 'f');
    
    if (this.isEmpty)
      return List.empty;
    
		const self = this;
		const l: any[] = [];
		let i = 0;
		const it = this.elements.keys();
		function exec(): Promise<any[]> | any[] {
			while (true) {
				const next = it.next();
				if (next.done)
					return l;
				const r = f.invoke(undefined, JelString.valueOf(next.value), self.elements.get(next.value) || null, Float.valueOf(i));
				i++;
				if (r instanceof Promise)
					return r.then(v=> {
						l.push(v);
						return exec();
					});
				else
					l.push(r);
			}
		}
		return Util.resolveValue(exec(), l=>new List(l));
	}

  
	mapJs(f: (k: string, v: JelObject|null, i: number)=>JelObject|null): Dictionary {
		const self = this;
		const newDict = new Dictionary(undefined, false, this.defaultValue);
		let i = 0;
		const it = this.elements.keys();
		while (true) {
			const next = it.next();
			if (next.done)
				return newDict;
      const k = next.value;
	    newDict.elements.set(k, f(k, this.elements.get(next.value) as JelObject|null, i++));
		}
	}

 	mapToArrayJs(f: (k: string, v: JelObject|null, i: number)=>JelObject|null): any[] {
		const self = this;
		const l = [];
		let i = 0;
		const it = this.elements.keys();
		while (true) {
			const next = it.next();
			if (next.done)
				return l;
      const k = next.value;
	    l.push(f(k, this.elements.get(next.value) as JelObject|null, i++));
		}
	}

  
 	eachJs(f: (k: string, v: JelObject|null, i: number)=>any): Dictionary {
		const self = this;
		let i = 0;
		const it = this.elements.keys();
		while (true) {
			const next = it.next();
			if (next.done)
				return this;
			 f(next.value, this.elements.get(next.value) as JelObject|null, i++);
		}
	}
  
  duplicateKeysJs(other: Dictionary): string[] {
		const self = this;
		let i = 0;
    const d = [];
		for (let key of this.elements.keys())
      if (other.elements.has(key))
        d.push(key);
    return d;
	}

  
	filter_jel_mapping: boolean;
	filter(ctx: Context, f0: any): Dictionary | Promise<Dictionary> {
		const f: Callable = TypeChecker.instance(Callable, f0, 'f');
		const self = this;
		const newDict = new Dictionary(undefined, false, this.defaultValue);
		let i = 0;
		const it = this.elements.keys();
		function exec(): Promise<Dictionary> | Dictionary {
			while (true) {
				const next = it.next();
				if (next.done)
					return newDict;
				const thisValue = self.elements.get(next.value) as JelObject;
				const r = f.invoke(undefined, JelString.valueOf(next.value), thisValue, Float.valueOf(i));
				i++;
				if (r instanceof Promise)
					return r.then(v=> {
						if (JelBoolean.toRealBoolean(v))
							newDict.elements.set(next.value, thisValue);
						return exec();
					});
				else if (JelBoolean.toRealBoolean(r))
					newDict.elements.set(next.value, thisValue);
			}
		}
		return exec();
	}

 	filterJs(f: (key: string, value: JelObject|null)=>boolean): Dictionary {
		const newDict = new Dictionary(undefined, false, this.defaultValue);
		for (let key of this.elements.keys()) {
      const value = (this.elements.get(key)||null) as JelObject|null;
      if (f(key, value))
        newDict.elements.set(key, value);
    }
    return newDict;
	}
  
	reduce_jel_mapping: boolean;
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
				const r = f.invoke(undefined, result, JelString.valueOf(next.value), self.elements.get(next.value) || null, Float.valueOf(i));
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

	hasAny_jel_mapping: boolean;
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
				const r = f.invoke(undefined, JelString.valueOf(next.value), self.elements.get(next.value) || null, Float.valueOf(i));
				i++;
				if (r instanceof Promise)
					return r.then(v=> JelBoolean.toRealBoolean(v) ? JelBoolean.TRUE : exec());
				else if (JelBoolean.toRealBoolean(r))
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

  findJs(f: (k: string, v: JelObject|null)=>boolean): any {
    for (let key of this.elements.keys())
      if (f(key, this.elements.get(key) || null))
        return key;
    return undefined;
	}

  
	hasOnly_jel_mapping: boolean;
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
				const r = f.invoke(undefined, JelString.valueOf(next.value), self.elements.get(next.value) || null, Float.valueOf(i));
				i++;
				if (r instanceof Promise)
					return r.then(v=> JelBoolean.toRealBoolean(v) ? exec() : JelBoolean.FALSE);
				else if (!JelBoolean.toRealBoolean(r))
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
  
  hasOnlyWithPromises(f: (k: string, v: JelObject|null)=>JelBoolean|Promise<JelBoolean>): JelBoolean | Promise<JelBoolean> {
		const self = this;
		const it = this.elements.keys();
		function exec(): Promise<JelBoolean> | JelBoolean {
			while (true) {
				const next = it.next();
				if (next.done)
					return JelBoolean.TRUE;
				const r = f(next.value, self.elements.get(next.value) || null);
				if (r instanceof Promise)
					return r.then(v=> JelBoolean.toRealBoolean(v) ? exec() : JelBoolean.FALSE);
				else if (!JelBoolean.toRealBoolean(r))
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
		const addElement = (value: any, key: string) => {
			if (pretty)
				r += '\n'+spaces.substr(0, 2);
			if (typeof key == 'string' && /^[a-zA-Z_]\w*$/.test(key))
				r += key;
			else
				r += serializer(key, pretty, indent,spaces);
			r += (pretty ? ': ' : ':') + serializer(value, pretty, indent, spaces);
			if (i++ < last)
				r += pretty ? ', ' : ',';
		};
		if (pretty) {
			r += '\n';
			Array.from(this.elements.keys()).sort().forEach(k=>addElement(this.elements.get(k), k));
		}
		else
			this.elements.forEach(addElement);
		return r + '}';
	}

  static merge(dicts?: Dictionary[]): Dictionary {
    if (!dicts || !dicts.length)
      return Dictionary.empty;
    if (dicts.length == 1)
      return dicts[0];
    if (dicts.length == 2 && dicts[0].isEmpty)
      return dicts[1];
    let d = new Dictionary();
    for (let i = 0; i < dicts.length; i++)
      d = d.putAll(dicts[i]);
    return d;
  }

	static valueOf(data?: Map<string, any>, keepMap = false): Dictionary {
		return new Dictionary(data, keepMap);
	}
	
	static create_jel_mapping = {list: 1}; // 2nd ctor argument intentionally omittted!
	static create(ctx: Context, ...args: any[]): any {
		return new Dictionary(args[0]);  // 2nd ctor argument intentionally omittted! They are not intended for JEL.
	}
}


Dictionary.prototype.size_jel_property = true;
Dictionary.prototype.anyKey_jel_property = true;
Dictionary.prototype.keys_jel_property = true;
Dictionary.prototype.isEmpty_jel_property = true;
Dictionary.prototype.defaultValue_jel_property = true;
Dictionary.prototype.get_jel_mapping = true;
Dictionary.prototype.withDefault_jel_mapping = true;
Dictionary.prototype.has_jel_mapping = true;
Dictionary.prototype.set_jel_mapping = true;
Dictionary.prototype.setAll_jel_mapping = true;
Dictionary.prototype.delete_jel_mapping = true;
Dictionary.prototype.deleteAll_jel_mapping = true;
Dictionary.prototype.map_jel_mapping = true;
Dictionary.prototype.mapToList_jel_mapping = true;
Dictionary.prototype.filter_jel_mapping = true;
Dictionary.prototype.reduce_jel_mapping = true;
Dictionary.prototype.hasAny_jel_mapping = true;
Dictionary.prototype.hasOnly_jel_mapping = true;

BaseTypeRegistry.register('Dictionary', Dictionary);
