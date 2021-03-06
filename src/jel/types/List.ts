import Util from '../../util/Util';
import BaseTypeRegistry from '../BaseTypeRegistry';
import SerializablePrimitive from '../SerializablePrimitive';
import Context from '../Context';
import Runtime from '../Runtime';
import JelObject from '../JelObject';
import Float from './Float';
import NativeJelObject from './NativeJelObject';
import Class from './Class';
import JelString from './JelString';
import JelBoolean from './JelBoolean';
import Callable from '../Callable';
import TypeChecker from './TypeChecker';

/**
 * List is an immutable array-like object that is accessible from JEL.
 */
export default class List extends NativeJelObject implements SerializablePrimitive {
	elements: any[]; // list elements, guaranteed to be no Promises

  static clazz: Class|undefined;

	static empty_jel_property = true;
	static empty = new List();


	constructor(elements: List|any[]|IterableIterator<any> = []) {
		super("List");
		this.elements = elements instanceof List ? elements.elements : Array.isArray(elements) ? elements : Array.from(elements);
    
    for (let i = 0; i < this.elements.length; i++)
      if (this.elements[i] instanceof Promise)
        throw new Error('ELment '+i+' is a promise');
    

	}
  
  get clazz(): Class {
    return List.clazz!;
  }

	op(ctx: Context, operator: string, right: JelObject, isReversal: boolean = false): JelObject|Promise<JelObject> {
		if (right == null)
			return this;
		if (right instanceof List) {
			switch(operator) {
				case '==':
				case '===':
					if (this.elements.length != right.elements.length)
						return JelBoolean.FALSE;
					let result: JelBoolean | Promise<JelBoolean> = JelBoolean.TRUE;
					for (let i = 0; i < this.elements.length; i++)
						result = JelBoolean.falsestWithPromises(ctx, result, Runtime.op(ctx, operator, this.elements[i], right.elements[i]) as any);
					return result;
				case '+':
					return new List(this.elements.concat(right.elements));
			}
		}
		else {
			switch(operator) {
				case '==':
				case '===':
				case '!=':
				case '!==':
				case '>':
				case '<':
				case '<=':
				case '>=':
				case '>>':
				case '<<':
				case '<<=':
				case '>>=':
					if (this.elements.length == 1)
						return Runtime.op(ctx, operator, this.elements[0], right);
					else
						return JelBoolean.FALSE;
				case '+':
					const l = this.elements.slice();
					l.push(right);
					return new List(l);
			}
		}
		return super.op(ctx, operator, right, isReversal);
	}
	
	singleOp(ctx: Context, operator: string): JelObject|Promise<JelObject> {
		if (operator == '!')
			return JelBoolean.valueOf(!this.elements.length);
		else
			return super.singleOp(ctx, operator);
	}

	
	get_jel_mapping: Object;
	get(ctx: Context, index0: any): any {
		const index = TypeChecker.realNumber(index0, 'index');

		let v;
		if (index >= 0)
			v = this.elements[index];
		else
			v = this.elements[this.elements.length - index];
		return v == undefined ? null : v;
	}
	
  first_jel_property: boolean;
	get first(): any {
		const v = this.elements[0];
		return v === undefined ? null : v;
	}

  last_jel_property: boolean;
	get last(): any {
		const v = this.elements[this.elements.length-1];
		return v === undefined ? null : v;
	}
	
  length_jel_property: boolean;
	get length(): number {
		return this.elements.length;
	}
  size_jel_property: boolean;
	get size(): number {
		return this.elements.length;
	}
  isEmpty_jel_property: boolean;
	get isEmpty(): boolean {
		return !this.elements.length;
	}
	
	map_jel_mapping: Object;
	map(ctx: Context, f0: any): List | Promise<List> {
		const f: Callable = TypeChecker.instance(Callable, f0, 'f');
		const newList: any[] = [];
		return Util.processPromiseList(this.elements, (e,i)=>f.invoke(undefined, e, Float.valueOf(i)), v=>{newList.push(v);}, ()=>new List(newList));
	}

	collect_jel_mapping: Object;
	collect(ctx: Context, f0: any): List | Promise<List> {
		const f: Callable = TypeChecker.instance(Callable, f0, 'f');
		const newList: any[] = [];
		return Util.processPromiseList(this.elements, (e,i)=>f.invoke(undefined, e, Float.valueOf(i)), v=>{
			if (v != null) {
				if (v instanceof List)
					newList.push(...v.elements);
				else
					newList.push(v);
			}
		}, ()=>new List(newList));
	}

	filter_jel_mapping: Object;
	filter(ctx: Context, f0: any, max0: any): Promise<List> | List {
		const f: Callable = TypeChecker.instance(Callable, f0, 'f');
		const max: number|null = TypeChecker.optionalRealNumber(max0, 'max');
		const newList: any[] = [];

		return Util.processPromiseList(this.elements, (e,i)=>f.invoke(undefined, e, Float.valueOf(i)), (v, e)=> {
			if (JelBoolean.toRealBoolean(v) && (max==null || newList.length < max))
				newList.push(e);

      if (max != null && newList.length >= max)
        return false;
		}, ()=>new List(newList));
	}

	filterNull_jel_mapping: Object;
	filterNull(ctx: Context): Promise<List> | List {
    return List.valueOf(this.elements.filter(e=>e!=null)); 
	}

  
	reduce_jel_mapping: Object;
	reduce(ctx: Context, f0: any, init: any): Promise<any> | any {
		const f: Callable = TypeChecker.instance(Callable, f0, 'f');
		let result: any = init;
		
		return Util.processPromiseList(this.elements, (v,i)=>f.invoke(undefined, v, result, Float.valueOf(i)), v=>{result=v;}, ()=>result);
	}

	hasAny_jel_mapping: Object;
	hasAny(ctx: Context, f0: any): JelBoolean | Promise<JelBoolean> {
		const f: Callable = TypeChecker.instance(Callable, f0, 'f');
		return Util.processPromiseList(this.elements, (e,i)=>f.invoke(undefined, e, Float.valueOf(i)), (v, e)=>JelBoolean.toRealBoolean(v) ? JelBoolean.TRUE : undefined, r=>r || JelBoolean.FALSE);
	}

 	contains_jel_mapping: Object;
	contains(ctx: Context, b: any): JelBoolean | Promise<JelBoolean> {
		return Util.processPromiseList(this.elements, e=>Runtime.op(ctx, '==', e, b), (v, e)=>JelBoolean.toRealBoolean(v) ? JelBoolean.TRUE : undefined, r=>r || JelBoolean.FALSE);
	}

  hasAnyJs(f: (a: JelObject|null, i: number)=>boolean): boolean {
		for (let i = 0; i < this.elements.length; i++)
      if (f(this.elements[i], i))
        return true;
    return false;
	}

  
  
  toDictionaryJs(f: (a: JelObject|null, i: number)=>string): boolean {
    const d = BaseTypeRegistry.get('Dictionary').valueOf();
		for (let i = 0; i < this.elements.length; i++)
      d.elements.set(f(this.elements[i], i), this.elements[i]);
    return d;
  }

  mapJs(f: (a: JelObject|null, i: number)=>JelObject|null): List {
    const l: (JelObject|null)[] = [];
		for (let i = 0; i < this.elements.length; i++)
      l.push(f(this.elements[i], i));
    return new List(l);
  }

  
	hasOnly_jel_mapping: Object;
	hasOnly(ctx: Context, f0: any): JelBoolean | Promise<JelBoolean> {
		const f: Callable = TypeChecker.instance(Callable, f0, 'f');
		return Util.processPromiseList(this.elements, (e,i)=>f.invoke(undefined, e, Float.valueOf(i)), (v, e)=>JelBoolean.toRealBoolean(v) ? undefined : JelBoolean.FALSE, r=>r || JelBoolean.TRUE);
	}

	hasOnlyJs(f: (a: JelObject|null, i: number)=>boolean): boolean {
		for (let i = 0; i < this.elements.length; i++)
      if (!f(this.elements[i], i))
        return false;
    return true;
	}
  
  hasOnlyWithPromises(f: (a: JelObject|null, i: number)=>JelBoolean | Promise<JelBoolean>): JelBoolean | Promise<JelBoolean> {
		return Util.processPromiseList(this.elements, (e,i)=>f(e, i), (v, e)=>JelBoolean.toRealBoolean(v) ? undefined : JelBoolean.FALSE, r=>r || JelBoolean.TRUE);
	}

 	firstMatch_jel_mapping: Object;
	firstMatch(ctx: Context, f0: any): JelObject | null | Promise<JelObject | null> {
		return this.nthMatch(ctx, 1, f0);
	}

 	lastMatch_jel_mapping: Object;
	lastMatch(ctx: Context, f0: any): JelObject | null | Promise<JelObject | null> {
		return this.nthMatch(ctx, -1, f0);
	}

 	nthMatch_jel_mapping: Object;
	nthMatch(ctx: Context, index0: any, f0: any): JelObject | null | Promise<JelObject | null> {
		const f: Callable = TypeChecker.instance(Callable, f0, 'f');
    const index: number = TypeChecker.realNumber(index0, 'index');
    if (index == 0)
      throw new Error('Index must not be 0. nthMatch is not 0-based.');
    const absIndex = Math.abs(index);
    let matchCount = 0;
		return Util.processPromiseList(this.elements, (e,i)=>f.invoke(undefined, e, Float.valueOf(i)), (v, e)=>{
      if (JelBoolean.toRealBoolean(v)) {
        if (++matchCount == absIndex)
          return e;
      }
    }, r=>r || null, index>0);
	}
  
 	firstMatchIndex_jel_mapping: Object;
	firstMatchIndex(ctx: Context, f0: any): JelObject | null | Promise<JelObject | null> {
		const f: Callable = TypeChecker.instance(Callable, f0, 'f');
		return Util.processPromiseList(this.elements, (e,i)=>f.invoke(undefined, e, Float.valueOf(i)), (v, e, i)=>{
      if (JelBoolean.toRealBoolean(v))
          return Float.valueOf(i);
    }, r=>r || null);	
  }
  
  
	// isBetter(a,b) checks whether a is better than b (must return false is both are equally good)
	// returns one or more that items that were better than everything else.
	bestMatches_jel_mapping: Object;
	bestMatches(ctx: Context, isBetter0: any): List | Promise<List> {
		const isBetter: Callable = TypeChecker.instance(Callable, isBetter0, 'isBetter');
		if (!this.elements.length)
			return List.empty;
		
		const self = this;
		const l = [this.first];
		let i = 1;
		const len = this.elements.length;
		
		function check1Passed(e: any): undefined | Promise<any> {
			const check2 = isBetter.invoke(undefined, e, l[0]);
			if (check2 instanceof Promise) 
				return check2.then(v=>JelBoolean.toRealBoolean(v) ? l.splice(0, self.elements.length, e) : l.push(e))
			else if (JelBoolean.toRealBoolean(check2))
				l.splice(0, self.elements.length, e);
			else
				l.push(e);
		}
		
		function exec(): any[] | Promise<any[]> {
			while (i < len) {
				const e = self.elements[i++];
				const check1 = isBetter.invoke(undefined, l[0], e);
				if (check1 instanceof Promise) 
					return check1.then((v: any) => {
						if (!JelBoolean.toRealBoolean(v)) {
							const c2 = check1Passed(e);
							if (c2 instanceof Promise)
								return c2.then(exec);
							else
								return exec();
						}
						else
							return exec();
					});
				else if (!JelBoolean.toRealBoolean(check1)) {
					const check2 = check1Passed(e);
					if (check2)
						return check2.then(exec);
				}
			}
			return l;
		}
		return Util.resolveValue(exec(), l=>new List(l));
	}
	
	sub_jel_mapping: Object;
	sub(ctx: Context, start0?: any, end0?: any) {
		const start = TypeChecker.optionalRealNumber(start0, 'start');
		const end = TypeChecker.optionalRealNumber(end0, 'end');
    if (start == end && start != null)
      return List.empty;
		return new List(this.elements.slice(start == null ? 0 : start >= 0 ? start : this.elements.length + start, 
																				end == null ? this.elements.length : end >= 0 ? end : this.elements.length + end));
	}

	subLen_jel_mapping: Object;
	subLen(ctx: Context, start0?: any, len0?: any) {
		const start = TypeChecker.realNumber(start0, 'start', 0);
		const len = TypeChecker.optionalRealNumber(len0, 'length');
    if (len == 0)
      return List.empty;
    const s = start >= 0 ? start : this.elements.length + start;
    return new List(this.elements.slice(s, len == null ? this.elements.length : s+len));
  }

  add_jel_mapping: Object;
	add(ctx: Context, value: any) {
    const p = this.elements.concat();
    p.push(value);
    return new List(p);
  }
  
  
  addAll_jel_mapping: Object;
	addAll(ctx: Context, list0: any) {
    const list = TypeChecker.instance(List, list0, 'list');
    if (list.elements.length)
      return new List(this.elements.concat(list.elements));
    else
      return this;
  }
  
	private partition(ctx: Context, l: any[], start: number, end: number, isLess: (a: any, b: any)=>boolean|Promise<boolean>): number | Promise<number> {
		function swap(a: number, b: number): void {
			const tmp = l[a];
			l[a] = l[b];
			l[b] = tmp;
		}
		const pivot = l[end];
		let i = start - 1;
		let j = start;
		function exec(): Promise<any> | undefined {
			while (j <= end - 1) {
				const il = isLess(l[j], pivot);
				if (il instanceof Promise) {
					return il.then(ilr=> {
						if (ilr) {
							i++;
							swap(i, j);
						}
						j++;
						return exec();
					});
				}
				else if (il) {
					i++;
					swap(i, j);
				}
				j++;
			}
		}
		
		const ex = exec();
		if (ex instanceof Promise) 
			return ex.then(()=>{swap(i+1, end); return i+1});
		swap(i+1, end);
		return i + 1;
	}
	
	private quickSort(ctx: Context, l: any[], start: number, end: number, isLess: (a: any, b: any)=>boolean|Promise<boolean>): undefined | Promise<any> {
		if (start < end) {
			const pi = this.partition(ctx, l, start, end, isLess);
			if (pi instanceof Promise)
				return pi.then(pi=>Promise.all([this.quickSort(ctx, l, start, pi - 1, isLess), this.quickSort(ctx, l, pi + 1, end, isLess)]));

			this.quickSort(ctx, l, start, pi - 1, isLess);
			this.quickSort(ctx, l, pi + 1, end, isLess);
		}
	}
	
	private static toPromisedRealBoolean(ctx: Context, b: any): boolean | Promise<boolean> {
		if (b instanceof Promise)
			return b.then(v=>JelBoolean.toRealBoolean(v));
		else
			return JelBoolean.toRealBoolean(b);
	}
  
	private static toPromisedBoolean(ctx: Context, b: any): JelBoolean | Promise<JelBoolean> {
		if (b instanceof Promise)
			return b.then(v=>JelBoolean.toBoolean(ctx, v));
		else
			return JelBoolean.toBoolean(ctx, b);
	}

  
	// isLess(a, b) checks whether a<b . If a==b or a>b, is must return false. If a==b, then !isLess(a,b)&&!isLess(b,a)
	// key is either the string of a property name, or a function key(a) that return the key for a.
	sort_jel_mapping: Object;
	sort(ctx: Context, isLess0?: any, key0?: any, desc0?: any): List | Promise<List> {
		const isLess: Callable | null = TypeChecker.optionalInstance(Callable, isLess0, 'isLess');
		const key: JelString | Callable = key0 instanceof JelString ? key0 : TypeChecker.optionalInstance(Callable, key0, 'key');
		const desc: boolean = TypeChecker.realBoolean(desc0, 'desc', false);
  
		if (this.elements.length < 2)
			return this;

		const l: any[] = Array.prototype.slice.call(this.elements);
		let r: undefined | Promise<any> = undefined;
		if (key instanceof JelString) {
			if (isLess) {
        const cmp = desc ? (a: any, b: any)=>isLess.invoke(undefined, b, a) : (a: any, b: any)=>isLess.invoke(undefined, a, b);
        r = this.quickSort(ctx, l, 0, l.length-1, (a0: any, b0: any)=>List.toPromisedRealBoolean(ctx, Util.resolveValues(cmp, Runtime.member(ctx, a0, key.value), Runtime.member(ctx, b0, key.value))));
      }
			else
				r = this.quickSort(ctx, l, 0, l.length-1, (a0: any, b0: any)=>List.toPromisedRealBoolean(ctx, Util.resolveValues((a: any, b: any)=>Runtime.op(ctx, desc ? '>' : '<', a, b), Runtime.member(ctx, a0, key.value), Runtime.member(ctx, b0, key.value))));
		}
		else if (key instanceof Callable) { 
			if (isLess) {
        const cmp = desc ? (a: any, b: any)=>isLess.invoke(undefined, b, a) : (a: any, b: any)=>isLess.invoke(undefined, a, b);
				r = this.quickSort(ctx, l, 0, l.length-1, (a0: any, b0: any)=>List.toPromisedRealBoolean(ctx, Util.resolveValues(cmp, key.invoke(undefined, a0), key.invoke(undefined, b0))));
      }
			else
				r = this.quickSort(ctx, l, 0, l.length-1, (a0: any, b0: any)=>List.toPromisedRealBoolean(ctx, Util.resolveValues((a: any, b: any)=>Runtime.op(ctx, desc ? '>' : '<', a, b), key.invoke(undefined, a0), key.invoke(undefined, b0))));
		}
		else if (isLess) {
     const cmp = desc ? (a: any, b: any)=>List.toPromisedRealBoolean(ctx, isLess.invoke(undefined, b, a)) : (a: any, b: any)=>List.toPromisedRealBoolean(ctx, isLess.invoke(undefined, a, b));
			r = this.quickSort(ctx, l, 0, l.length-1, cmp);
    }
		else
			r = this.quickSort(ctx, l, 0, l.length-1, (a: any, b: any)=>List.toPromisedRealBoolean(ctx, Runtime.op(ctx, desc ? '>' : '<', a, b) as JelBoolean));

    return Util.resolveValue(r, ()=>new List(l));
	}

	private findBest(isBetter: (a: any, b: any)=>JelBoolean|Promise<JelBoolean>, inverse: boolean): any {
		if (!this.elements.length)
			return null;
		
		const self = this;
		let l = this.first;
		let i = 1;
		const len = this.elements.length;
		
		function exec(): any[] | Promise<any[]> {
			while (i < len) {
				const e = self.elements[i++];
				const check1 = isBetter(l, e);
				if (check1 instanceof Promise) 
					return check1.then((v: any) => {
						if (JelBoolean.toRealBoolean(v) != inverse)
							l = e;
						return exec();
					});
				else if (JelBoolean.toRealBoolean(check1) != inverse)
					l = e;
			}
			return l;
		}
		return exec();
	}
	
	private minMax(ctx: Context, isMax: boolean, isLess: Callable|null, key: JelString | Callable | null): any {
		if (key instanceof JelString) {
			if (isLess) 
				return this.findBest((a0: any, b0: any)=>Util.resolveValues((a: any, b: any)=>List.toPromisedBoolean(ctx, isLess.invoke(undefined, a, b)), Runtime.member(ctx, a0, key.value), Runtime.member(ctx, b0, key.value)), isMax);
			else
				return this.findBest((a0: any, b0: any)=>Util.resolveValues((a: any, b: any)=>Runtime.op(ctx, '<', a, b), Runtime.member(ctx, a0, key.value), Runtime.member(ctx, b0, key.value)), isMax);
		}
		else if (key instanceof Callable) {
			if (isLess) 
				return this.findBest((a0: any, b0: any)=>Util.resolveValues((a: any, b: any)=>List.toPromisedBoolean(ctx, isLess.invoke(undefined, a, b)), key.invoke(undefined, a0), key.invoke(undefined, b0)), isMax);
			else
				return this.findBest((a0: any, b0: any)=>Util.resolveValues((a: any, b: any)=>Runtime.op(ctx, '<', a, b), key.invoke(undefined, a0), key.invoke(undefined, b0)), isMax);
		}
		else if (isLess)
				return this.findBest((a0: any, b0: any)=>List.toPromisedBoolean(ctx, isLess.invoke(undefined, a0, b0)), isMax);
		else
				return this.findBest((a0: any, b0: any)=>Runtime.op(ctx, '<', a0, b0) as any, isMax);
	}
	
	max_jel_mapping: Object;
	max(ctx: Context, isLess0?: any, key0?: any): any {
		const isLess: Callable | null = TypeChecker.optionalInstance(Callable, isLess0, 'isLess');
		const key: JelString | Callable = key0 instanceof JelString ? key0 : TypeChecker.optionalInstance(Callable, key0, 'key');
		return this.minMax(ctx, false, isLess, key);
	}

	min_jel_mapping: Object;
	min(ctx: Context, isLess0?: any, key0?: any): any {
		const isLess: Callable | null = TypeChecker.optionalInstance(Callable, isLess0, 'isLess');
		const key: JelString | Callable = key0 instanceof JelString ? key0 : TypeChecker.optionalInstance(Callable, key0, 'key');
		return this.minMax(ctx, true, isLess, key);
	}

	flatten_jel_mapping: Object;
	flatten(ctx: Context, f0: any): List | Promise<List> {
		const newList: any[] = [];
		for (let i = 0; i < this.elements.length; i++) {
			const v = this.elements[i];
			if (v != null) {
				if (v instanceof List)
					newList.push(...v.elements);
				else
					newList.push(v);
			}
		}
		return new List(newList);
	}
	
	toNullable(): List|null {
		return this.elements.length ? this : null;
	}

	serializeToString(pretty: boolean, indent: number, spaces: string, serializer: (object: any, pretty: boolean, indent: number, spaces: string)=>string): string | undefined {
		let r = '[';
		for (let i = 0; i < this.elements.length-1; i++)
			r += serializer(this.elements[i], pretty, indent, spaces) + (pretty ? ', ' : ',');
		if (this.elements.length)
			r += serializer(this.elements[this.elements.length-1], pretty, indent, spaces);
		return r + ']';
	}
  
 	static valueOf(a: any[]): List {
		return a.length == 0 ? List.empty : new List(a);
	}

 	static wrap(a: any): List {
    if (a instanceof List)
      return a;
    else if (!a)
      return List.empty;
		return new List([a]);
	}

  
	static create_jel_mapping = ['elements'];
	static create(ctx: Context, ...args: any[]): any {
		return new List(TypeChecker.optionalType('List', args[0], 'elements', []));
	}
}

List.prototype.first_jel_property = true;
List.prototype.last_jel_property = true;
List.prototype.length_jel_property = true;
List.prototype.size_jel_property = true;
List.prototype.isEmpty_jel_property = true;


List.prototype.get_jel_mapping = true;
List.prototype.add_jel_mapping = true;
List.prototype.addAll_jel_mapping = true;
List.prototype.map_jel_mapping = true;
List.prototype.filter_jel_mapping = true;
List.prototype.filterNull_jel_mapping = true;
List.prototype.flatten_jel_mapping = true;
List.prototype.collect_jel_mapping = true;
List.prototype.reduce_jel_mapping = true;
List.prototype.hasAny_jel_mapping = true;
List.prototype.contains_jel_mapping = true;
List.prototype.hasOnly_jel_mapping = true;
List.prototype.firstMatchIndex_jel_mapping = true;
List.prototype.firstMatch_jel_mapping = true;
List.prototype.lastMatch_jel_mapping = true;
List.prototype.nthMatch_jel_mapping = true;
List.prototype.bestMatches_jel_mapping = true;
List.prototype.sub_jel_mapping = true;
List.prototype.subLen_jel_mapping = true;
List.prototype.sort_jel_mapping = true;
List.prototype.max_jel_mapping = true;
List.prototype.min_jel_mapping = true;

BaseTypeRegistry.register('List', List);
		