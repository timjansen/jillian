import JelObject from '../JelObject';
import Runtime from '../Runtime';
import SerializablePrimitive from '../SerializablePrimitive';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Context from '../Context';
import Float from './Float';
import JelString from './JelString';
import List from './List';
import JelBoolean from './JelBoolean';
import TypeChecker from './TypeChecker';
import Callable from '../Callable';
import Util from '../../util/Util';


const LIST_OR_DICTIONARY = ['List', 'Dictionary'];

/**
 * Dictionary is a map-like type for JEL.
 */
export default class Dictionary extends JelObject implements SerializablePrimitive {
	elements: Map<string, JelObject|null>;
	
	JEL_PROPERTIES: Object;
	static readonly JEL_PROPERTIES = {empty: true};
	static readonly empty = new Dictionary();
	
	constructor(elements?: any, keepMap = false) {
		super();
		if (keepMap && elements)
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
        case '+':
          return this.setAll(ctx, right);
        case '-':
          return this.deleteAll(ctx, right);
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
  
  member(ctx: Context, name: string, parameters?: Map<string, JelObject|null>): JelObject|null|undefined {
		if (name in this.JEL_PROPERTIES)
			return BaseTypeRegistry.mapNativeTypes((this as any)[name]);
    if ((name+'_jel_mapping') in this)
      return undefined;
    
		return this.elements.get(name);
	}

	has_jel_mapping: Object;
	has(ctx: Context, key0: JelString | string): JelBoolean {
		const key = TypeChecker.realString(key0, 'key');
		return JelBoolean.valueOf(this.elements.has(key));
	}

  set_jel_mapping: Object;
  set(ctx: Context, key0: any, value: JelObject|null): Dictionary {
		const key = TypeChecker.realString(key0, 'key');
		const t = new Dictionary(this);
		t.elements.set(key, value);
		return t;
	}

  setAll_jel_mapping: Object;
  setAll(ctx: Context, other0: any): Dictionary {
		const other = TypeChecker.instance(Dictionary, other0,'other');
    if (other.empty)
      return this;
    else if (this.empty)
      return other;
    else 
      return new Dictionary(this).putAll(other);
  }

  delete_jel_mapping: Object;
  delete(ctx: Context, key0: any): Dictionary {
	  const key = TypeChecker.realString(key0, 'key');
    if (!key)
      return this;
    const d = new Dictionary(this);
    d.elements.delete(key);
    return d;
  }

  
  deleteAll_jel_mapping: Object;
  deleteAll(ctx: Context, keys0: any): Dictionary {
	  const keys = TypeChecker.types(['Dictionary', 'List'], keys0, 'keys');
    if (this.empty || keys.empty)
      return this;
    const d = new Dictionary(this);
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
				const r = f.invoke(ctx, undefined, JelString.valueOf(next.value), self.elements.get(next.value) || null, Float.valueOf(i));
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
				const r = f.invoke(ctx, undefined, JelString.valueOf(next.value), self.elements.get(next.value) || null, Float.valueOf(i));
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

  mapToList_jel_mapping: Object;
	mapToList(ctx: Context, f0: any): List | Promise<List> {
		const f: Callable = TypeChecker.instance(Callable, f0, 'f');
		const self = this;
		const l: any[] = [];
		let i = 0;
		const it = this.elements.keys();
		function exec(): Promise<any[]> | any[] {
			while (true) {
				const next = it.next();
				if (next.done)
					return l;
				const r = f.invoke(ctx, undefined, JelString.valueOf(next.value), self.elements.get(next.value) || null, Float.valueOf(i));
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
		const newDict = new Dictionary();
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
				const r = f.invoke(ctx, undefined, JelString.valueOf(next.value), thisValue, Float.valueOf(i));
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

 	filterJs(f: (key: string, value: JelObject|null)=>JelObject|null): Dictionary {
		const newDict = new Dictionary();
		for (let key of this.elements.keys()) {
      const value = (this.elements.get(key)||null) as JelObject|null;
      newDict.elements.set(key, f(key, value));
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
				const r = f.invoke(ctx, undefined, result, JelString.valueOf(next.value), self.elements.get(next.value) || null, Float.valueOf(i));
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
				const r = f.invoke(ctx, undefined, JelString.valueOf(next.value), self.elements.get(next.value) || null, Float.valueOf(i));
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
				const r = f.invoke(ctx, undefined, JelString.valueOf(next.value), self.elements.get(next.value) || null, Float.valueOf(i));
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
Dictionary.prototype.get_jel_mapping = ['key'];
Dictionary.prototype.has_jel_mapping = ['key'];
Dictionary.prototype.set_jel_mapping = ['key', 'value'];
Dictionary.prototype.setAll_jel_mapping = ['other'];
Dictionary.prototype.delete_jel_mapping = ['key'];
Dictionary.prototype.deleteAll_jel_mapping = ['keys'];
Dictionary.prototype.each_jel_mapping = ['f'];
Dictionary.prototype.map_jel_mapping = ['f'];
Dictionary.prototype.mapToList_jel_mapping = ['f'];
Dictionary.prototype.filter_jel_mapping = ['f'];
Dictionary.prototype.reduce_jel_mapping = ['f', 'init'];
Dictionary.prototype.hasAny_jel_mapping = ['f'];
Dictionary.prototype.hasOnly_jel_mapping = ['f'];

BaseTypeRegistry.register('Dictionary', Dictionary);
