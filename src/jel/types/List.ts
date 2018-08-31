import Util from '../../util/Util';
import JelType from '../JelType';
import Context from '../Context';
import FuzzyBoolean from './FuzzyBoolean';
import Callable from '../Callable';
import Gettable from '../Gettable';

/**
 * List is an immutable array-like object that is accessible from JEL.
 */
export default class List extends JelType implements Gettable {
	elements: any[]; // list elements, guaranteed to be no Promises

	JEL_PROPERTIES: Object;

	static JEL_PROPERTIES = {empty: 1};
	static empty = new List();


	constructor(elements: List|any[]|IterableIterator<any> = []) {
		super();
		this.elements = elements instanceof List ? elements.elements : Array.isArray(elements) ? elements : Array.from(elements);
	}

	op(ctx: Context, operator: string, right: any) {
		if (right == null)
			return this;
		if (right instanceof List) {
			switch(operator) {
				case '==':
				case '===':
					if (this.elements.length != right.elements.length)
						return FuzzyBoolean.FALSE;
					let result: FuzzyBoolean | Promise<FuzzyBoolean> = FuzzyBoolean.TRUE;
					for (let i = 0; i < this.elements.length; i++)
						result = FuzzyBoolean.falsestWithPromises(ctx, result, JelType.op(ctx, operator, this.elements[i], right.elements[i]));
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
						return JelType.op(ctx, operator, this.elements[0], right);
					else
						return FuzzyBoolean.FALSE;
				case '+':
					const l = this.elements.slice();
					l.push(right);
					return new List(l);
			}
		}
		return super.op(ctx, operator, right);
	}
	
	singleOp(ctx: Context, operator: string): any {
		if (operator == '!')
			return FuzzyBoolean.toFuzzyBoolean(!this.elements.length);
		else
			return super.singleOp(ctx, operator);
	}

	
	get_jel_mapping: Object;
	get(ctx: Context, index: number): any {
		if (index >= 0)
			return this.elements[index];
		else
			return this.elements[this.elements.length - index];
	}
	
	get first(): any {
		const v = this.elements[0];
		return v === undefined ? null : v;
	}

	get last(): any {
		const v = this.elements[this.elements.length-1];
		return v === undefined ? null : v;
	}
	
	get length(): number {
		return this.elements.length;
	}
	
	each_jel_mapping: Object;
	each(ctx: Context, f: Callable): List | Promise<List> {
		const self = this;
		let i = 0;
		const len = this.elements.length;
		function exec(): Promise<List> | List {
			while (i < len) {
				const r = f.invoke(ctx, self.elements[i], i);
				i++;
				if (r instanceof Promise)
					return r.then(exec);
			}
			return self;
		}
		return exec();
	}

	map_jel_mapping: Object;
	map(ctx: Context, f: Callable): List | Promise<List> {
		const self = this;
		const newList: any[] = [];
		let i = 0;
		const len = this.elements.length;
		function exec(): Promise<undefined> | undefined {
			while (i < len) {
				const r = f.invoke(ctx, self.elements[i], i);
				i++;
				if (r instanceof Promise)
					return r.then(v=> {
						newList.push(v);
						return exec();
					});
				else
					newList.push(r);
			}
		}
		return Util.resolveValue(()=>new List(newList), exec());
	}

	filter_jel_mapping: Object;
	filter(ctx: Context, f: Callable): List {
		const self = this;
		const newList: any[] = [];
		let i = 0;
		const len = this.elements.length;
		function exec(): Promise<undefined> | undefined {
			while (i < len) {
				const e = self.elements[i];
				const r = f.invoke(ctx, e, i);
				i++;
				if (r instanceof Promise)
					return r.then(v=> {
						if (JelType.toRealBoolean(v))
							newList.push(e);
						return exec();
					});
				else if (JelType.toRealBoolean(r))
					newList.push(e);
			}
		}
		return Util.resolveValue(()=>new List(newList), exec());
	}
	
	reduce_jel_mapping: Object;
	reduce(ctx: Context, f: Callable, init: any): any {
		const self = this;
		let result: any = init;
		let i = 0;
		const len = this.elements.length;
		function exec(): Promise<undefined> | undefined {
			while (i < len) {
				const r = f.invoke(ctx, self.elements[i], result, i);
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
		const len = this.elements.length;
		function exec(): Promise<FuzzyBoolean> | FuzzyBoolean {
			while (i < len) {
				const r = f.invoke(ctx, self.elements[i], i);
				i++;
				if (r instanceof Promise)
					return r.then(v=> v.toRealBoolean() ? FuzzyBoolean.TRUE : exec());
				else if (r.toRealBoolean())
					return FuzzyBoolean.TRUE;
			}
			return FuzzyBoolean.FALSE;
		}
		return exec();
	}

	hasOnly_jel_mapping: Object;
	hasOnly(ctx: Context, f: Callable): FuzzyBoolean | Promise<FuzzyBoolean> {
		const self = this;
		let i = 0;
		const len = this.elements.length;
		function exec(): Promise<FuzzyBoolean> | FuzzyBoolean {
			while (i < len) {
				const r = f.invoke(ctx, self.elements[i], i);
				i++;
				if (r instanceof Promise)
					return r.then(v=> v.toRealBoolean() ? exec() : FuzzyBoolean.FALSE);
				else if (!r.toRealBoolean())
					return FuzzyBoolean.FALSE;
			}
			return FuzzyBoolean.TRUE;
		}
		return exec();
	}
	
	// isBetter(a,b) checks whether a is better than b (must return false is both are equally good)
	// returns one or more that items that were better than everything else.
	bestMatches_jel_mapping: Object;
	bestMatches(ctx: Context, isBetter: Callable): List {
		if (!this.elements.length)
			return List.empty;
		
		const self = this;
		const l = [this.first];
		let i = 1;
		const len = this.elements.length;
		
		function check1Passed(e: any): undefined | Promise<any> {
			const check2 = isBetter.invoke(ctx, e, l[0]);
			if (check2 instanceof Promise) 
				return check2.then(v=>JelType.toRealBoolean(v) ? l.splice(0, self.elements.length, e) : l.push(e))
			else if (JelType.toRealBoolean(check2))
				l.splice(0, self.elements.length, e);
			else
				l.push(e);
		}
		
		function exec(): any[] | Promise<any[]> {
			while (i < len) {
				const e = self.elements[i++];
				const check1 = isBetter.invoke(ctx, l[0], e);
				if (check1 instanceof Promise) 
					return check1.then((v: any) => {
						if (!JelType.toRealBoolean(v)) {
							const c2 = check1Passed(e);
							if (c2 instanceof Promise)
								return c2.then(exec);
							else
								return exec();
						}
						else
							return exec();
					});
				else if (!JelType.toRealBoolean(check1)) {
					const check2 = check1Passed(e);
					if (check2)
						return check2.then(exec);
				}
			}
			return l;
		}
		return Util.resolveValue(l=>new List(l), exec());
	}
	
	sub_jel_mapping: Object;
	sub(ctx: Context, start?: number, end?: number) {
		return new List(this.elements.slice(start == null ? 0 : start >= 0 ? start : this.elements.length + start, 
																				end == null ? this.elements.length : end >= 0 ? end : this.elements.length + end));
	}
	
	// isLess(a, b) checks whether a<b . If a==b or a>b, is must return false. If a==b, then !isLess(a,b)&&!isLess(b,a)
	// key is either the string of a property name, or a function key(a) that return the key for a.
	sort_jel_mapping: Object;
	sort(ctx: Context, isLess?: Callable, key?: string | Callable): List {
		const l: any[] = Array.prototype.slice.call(this.elements);
		if (typeof key == 'string') {
			if (isLess) 
				l.sort((a0: any, b0: any)=>{
					const a = JelType.member(ctx, a0, key), b = JelType.member(ctx, b0, key);
					return JelType.toRealBoolean(isLess.invoke(ctx, a,b)) ? -1 : (JelType.toRealBoolean(isLess.invoke(ctx, b,a)) ? 1 : 0)
				});
			else
				l.sort((a0: any, b0: any)=> { 
					const a = JelType.member(ctx, a0, key), b = JelType.member(ctx, b0, key);
					return JelType.toRealBoolean(JelType.op(ctx, '<', a, b)) ? -1 : (JelType.toRealBoolean(JelType.op(ctx, '>', a, b)) ? 1 : 0)
				});
		}
		else if (key instanceof Callable) {
			if (isLess) 
				l.sort((a0: any, b0: any)=>{
					const a = key.invoke(ctx, a0), b = key.invoke(ctx, b0);
					return JelType.toRealBoolean(isLess.invoke(ctx, a,b)) ? -1 : (JelType.toRealBoolean(isLess.invoke(ctx, b,a)) ? 1 : 0)
				});
			else
				l.sort((a0: any, b0: any)=> { 
					const a = key.invoke(ctx, a0), b = key.invoke(ctx, b0);
					return JelType.toRealBoolean(JelType.op(ctx, '<', a, b)) ? -1 : (JelType.toRealBoolean(JelType.op(ctx, '>', a, b)) ? 1 : 0)
				});
		}
		else if (isLess)
			l.sort((a: any, b: any)=>JelType.toRealBoolean(isLess.invoke(ctx, a,b)) ? -1 : (JelType.toRealBoolean(isLess.invoke(ctx, b,a)) ? 1 : 0));
		else
			l.sort((a: any, b: any)=>JelType.toRealBoolean(JelType.op(ctx, '<', a, b)) ? -1 : (JelType.toRealBoolean(JelType.op(ctx, '>', a, b)) ? 1 : 0));

		return new List(l);
	}

	private findBest(isBetter: (a: any, b: any)=>boolean): any {
		let best:any = undefined;
		for (let e of this.elements)
			if (best === undefined || isBetter(e, best))
				best = e;
		return best;
	}
	
	max_jel_mapping: Object;
	max(ctx: Context, isLess?: Callable, key?: string | Callable): any {
		if (typeof key == 'string') {
			if (isLess) 
				return this.findBest((a0: any, b0: any)=>!JelType.toRealBoolean(isLess.invoke(ctx, JelType.member(ctx, a0, key), JelType.member(ctx, b0, key))));
			else
				return this.findBest((a0: any, b0: any)=>!JelType.op(ctx, '<', JelType.member(ctx, a0, key), JelType.member(ctx, b0, key)).toRealBoolean());
		}
		else if (key instanceof Callable) {
			if (isLess) 
				return this.findBest((a0: any, b0: any)=>!JelType.toRealBoolean(isLess.invoke(ctx, key.invoke(ctx, a0), key.invoke(ctx, b0))));
			else
				return this.findBest((a0: any, b0: any)=>!JelType.op(ctx, '<', key.invoke(ctx, a0), key.invoke(ctx, b0)).toRealBoolean());
		}
		else if (isLess)
				return this.findBest((a0: any, b0: any)=>!JelType.toRealBoolean(isLess.invoke(ctx, a0, b0)));
		else
				return this.findBest((a0: any, b0: any)=>!JelType.op(ctx, '<', a0, b0).toRealBoolean());
	}

	min_jel_mapping: Object;
	min(ctx: Context, isLess?: Callable, key?: string | Callable): any {
		if (typeof key == 'string') {
			if (isLess) 
				return this.findBest((a0: any, b0: any)=>JelType.toRealBoolean(isLess.invoke(ctx, JelType.member(ctx, a0, key), JelType.member(ctx, b0, key))));
			else
				return this.findBest((a0: any, b0: any)=>JelType.op(ctx, '<', JelType.member(ctx, a0, key), JelType.member(ctx, b0, key)).toRealBoolean());
		}
		else if (key instanceof Callable) {
			if (isLess) 
				return this.findBest((a0: any, b0: any)=>JelType.toRealBoolean(isLess.invoke(ctx, key.invoke(ctx, a0), key.invoke(ctx, b0))));
			else
				return this.findBest((a0: any, b0: any)=>JelType.op(ctx, '<', key.invoke(ctx, a0), key.invoke(ctx, b0)).toRealBoolean());
		}
		else if (isLess)
				return this.findBest((a0: any, b0: any)=>JelType.toRealBoolean(isLess.invoke(ctx, a0, b0)));
		else
				return this.findBest((a0: any, b0: any)=>JelType.op(ctx, '<', a0, b0).toRealBoolean());
	}

	
	toNullable(): List|null {
		return this.elements.length ? this : null;
	}

	static create_jel_mapping = {elements: 1};
	static create(ctx: Context, ...args: any[]): any {
		return new List(args[0]);
	}
}

List.prototype.JEL_PROPERTIES = {first:1, last: 1, length: 1};

List.prototype.get_jel_mapping = {index: 1};
List.prototype.each_jel_mapping = {f: 1};
List.prototype.map_jel_mapping = {f: 1};
List.prototype.filter_jel_mapping = {f: 1};
List.prototype.reduce_jel_mapping = {f: 1, init: 2};
List.prototype.hasAny_jel_mapping = {f: 1};
List.prototype.hasOnly_jel_mapping = {f: 1};
List.prototype.bestMatches_jel_mapping = {isBetter: 1};
List.prototype.sub_jel_mapping = {start: 1, end: 2};
List.prototype.sort_jel_mapping = {isLess: 1, key: 2};
List.prototype.max_jel_mapping = {isLess: 1, key: 2};
List.prototype.min_jel_mapping = {isLess: 1, key: 2};


		