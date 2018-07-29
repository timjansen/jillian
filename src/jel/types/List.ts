import JelType from '../JelType';
import FuzzyBoolean from './FuzzyBoolean';
import Callable from '../Callable';
import Gettable from '../Gettable';

/**
 * List is an immutable array-like object that is accessible from JEL.
 */
export default class List extends JelType implements Gettable {
	elements: any[];

	JEL_PROPERTIES: Object;

	static JEL_PROPERTIES = {empty: 1};
	static empty = new List();


	
	constructor(elements: List|any[]|IterableIterator<any> = []) {
		super();
		this.elements = elements instanceof List ? elements.elements : Array.isArray(elements) ? elements : Array.from(elements);
	}

	op(operator: string, right: any) {
		if (right == null)
			return this;
		if (right instanceof List) {
			switch(operator) {
				case '==':
					if (this.elements.length != right.elements.length)
						return FuzzyBoolean.FALSE;
					let result = FuzzyBoolean.TRUE;
					for (let i = 0; i < this.elements.length; i++) {
						result = FuzzyBoolean.falsest(result, JelType.op('==', this.elements[i], right.elements[i]));
						if (result.isClearlyFalse())
							return result;
					}
					break;
				case '===':
					if (this.elements.length != right.elements.length)
						return FuzzyBoolean.FALSE;
					for (let i = 0; i < this.elements.length; i++) {
						if (!JelType.op('===', this.elements[i], right.elements[i]))
							return FuzzyBoolean.FALSE;
					}
					return FuzzyBoolean.TRUE;
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
						return JelType.op(operator, this.elements[0], right);
					else
						return FuzzyBoolean.FALSE;
				case '+':
					const l = this.elements.slice();
					l.push(right);
					return new List(l);
				case '-':
					return new List(this.elements.filter(e=>!JelType.op('==', e, right).toRealBoolean()));
			}
		}
		return super.op(operator, right);
	}
	
	get_jel_mapping: Object;
	get(index: number): any {
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
	each(f: Callable): List {
		this.elements.forEach((a,i)=>f.invoke(a,i));
		return this;
	}

	map_jel_mapping: Object;
	map(f: Callable): List {
		return new List(this.elements.map((a,i)=>f.invoke(a,i)));
	}

	filter_jel_mapping: Object;
	filter(f: Callable): List {
		return new List(this.elements.filter((a,i)=>JelType.toRealBoolean(f.invoke(a,i))));
	}
	
	reduce_jel_mapping: Object;
	reduce(f: Callable, init: any): any {
		return this.elements.reduce((a,e,i)=>f.invoke(a,e,i), init);
	}

	hasAny_jel_mapping: Object;
	hasAny(f: Callable): boolean {
		for (let i = 0; i < this.elements.length; i++)
			if (JelType.toRealBoolean(f.invoke(this.elements[i], i)))
				return true;
		return false;
	}

	hasOnly_jel_mapping: Object;
	hasOnly(f: Callable): boolean {
		for (let i = 0; i < this.elements.length; i++)
			if (!JelType.toRealBoolean(f.invoke(this.elements[i], i)))
				return false;
		return true;
	}
	
	// isBetter(a,b) checks whether a is better than b (must return false is both are equally good)
	bestMatches_jel_mapping: Object;
	bestMatches(isBetter: Callable): List {
		if (!this.elements.length)
			return List.empty;
		
		const l = [this.first];
		for (let i = 1; i < this.elements.length; i++) {
			const e = this.elements[i];
			if (!JelType.toRealBoolean(isBetter.invoke(l[0], e))) {
				if (JelType.toRealBoolean(isBetter.invoke(e, l[0])))
					l.splice(0, this.elements.length, e);
				else
					l.push(e);
			}
		}
		return new List(l);
	}
	
	sub_jel_mapping: Object;
	sub(start?: number, end?: number) {
		return new List(this.elements.slice(start == null ? 0 : start >= 0 ? start : this.elements.length + start, 
																				end == null ? this.elements.length : end >= 0 ? end : this.elements.length + end));
	}
	
	// isLess(a, b) checks whether a<b . If a==b or a>b, is must return false. If a==b, then !isLess(a,b)&&!isLess(b,a)
	// key is either the string of a property name, or a function key(a) that return the key for a.
	sort_jel_mapping: Object;
	sort(isLess?: Callable, key?: string | Callable): List {
		const l: any[] = Array.prototype.slice.call(this.elements);
		if (typeof key == 'string') {
			if (isLess) 
				l.sort((a0: any, b0: any)=>{
					const a = JelType.member(a0, key), b = JelType.member(b0, key);
					return JelType.toRealBoolean(isLess.invoke(a,b)) ? -1 : (JelType.toRealBoolean(isLess.invoke(b,a)) ? 1 : 0)
				});
			else
				l.sort((a0: any, b0: any)=> { 
					const a = JelType.member(a0, key), b = JelType.member(b0, key);
					return JelType.toRealBoolean(JelType.op('<', a, b)) ? -1 : (JelType.toRealBoolean(JelType.op('>', a, b)) ? 1 : 0)
				});
		}
		else if (key instanceof Callable) {
			if (isLess) 
				l.sort((a0: any, b0: any)=>{
					const a = key.invoke(a0), b = key.invoke(b0);
					return JelType.toRealBoolean(isLess.invoke(a,b)) ? -1 : (JelType.toRealBoolean(isLess.invoke(b,a)) ? 1 : 0)
				});
			else
				l.sort((a0: any, b0: any)=> { 
					const a = key.invoke(a0), b = key.invoke(b0);
					return JelType.toRealBoolean(JelType.op('<', a, b)) ? -1 : (JelType.toRealBoolean(JelType.op('>', a, b)) ? 1 : 0)
				});
		}
		else if (isLess)
			l.sort((a: any, b: any)=>JelType.toRealBoolean(isLess.invoke(a,b)) ? -1 : (JelType.toRealBoolean(isLess.invoke(b,a)) ? 1 : 0));
		else
			l.sort((a: any, b: any)=>JelType.toRealBoolean(JelType.op('<', a, b)) ? -1 : (JelType.toRealBoolean(JelType.op('>', a, b)) ? 1 : 0));

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
	max(isLess?: Callable, key?: string | Callable): any {
		if (typeof key == 'string') {
			if (isLess) 
				return this.findBest((a0: any, b0: any)=>!JelType.toRealBoolean(isLess.invoke(JelType.member(a0, key), JelType.member(b0, key))));
			else
				return this.findBest((a0: any, b0: any)=>!JelType.op('<', JelType.member(a0, key), JelType.member(b0, key)).toRealBoolean());
		}
		else if (key instanceof Callable) {
			if (isLess) 
				return this.findBest((a0: any, b0: any)=>!JelType.toRealBoolean(isLess.invoke(key.invoke(a0), key.invoke(b0))));
			else
				return this.findBest((a0: any, b0: any)=>!JelType.op('<', key.invoke(a0), key.invoke(b0)).toRealBoolean());
		}
		else if (isLess)
				return this.findBest((a0: any, b0: any)=>!JelType.toRealBoolean(isLess.invoke(a0, b0)));
		else
				return this.findBest((a0: any, b0: any)=>!JelType.op('<', a0, b0).toRealBoolean());
	}

	min_jel_mapping: Object;
	min(isLess?: Callable, key?: string | Callable): any {
		if (typeof key == 'string') {
			if (isLess) 
				return this.findBest((a0: any, b0: any)=>JelType.toRealBoolean(isLess.invoke(JelType.member(a0, key), JelType.member(b0, key))));
			else
				return this.findBest((a0: any, b0: any)=>JelType.op('<', JelType.member(a0, key), JelType.member(b0, key)).toRealBoolean());
		}
		else if (key instanceof Callable) {
			if (isLess) 
				return this.findBest((a0: any, b0: any)=>JelType.toRealBoolean(isLess.invoke(key.invoke(a0), key.invoke(b0))));
			else
				return this.findBest((a0: any, b0: any)=>JelType.op('<', key.invoke(a0), key.invoke(b0)).toRealBoolean());
		}
		else if (isLess)
				return this.findBest((a0: any, b0: any)=>JelType.toRealBoolean(isLess.invoke(a0, b0)));
		else
				return this.findBest((a0: any, b0: any)=>JelType.op('<', a0, b0).toRealBoolean());
	}

	
	toNullable(): List|null {
		return this.elements.length ? this : null;
	}

	static create_jel_mapping = {elements: 0};
	static create(...args: any[]): any {
		return new List(args[0]);
	}
}

List.prototype.JEL_PROPERTIES = {first:1, last: 1, length: 1};

List.prototype.get_jel_mapping = {index: 0};
List.prototype.each_jel_mapping = {f: 0};
List.prototype.map_jel_mapping = {f: 0};
List.prototype.filter_jel_mapping = {f: 0};
List.prototype.reduce_jel_mapping = {f: 0, init: 1};
List.prototype.hasAny_jel_mapping = {f: 0};
List.prototype.hasOnly_jel_mapping = {f: 0};
List.prototype.bestMatches_jel_mapping = {isBetter: 0};
List.prototype.sub_jel_mapping = {start: 0, end: 1};
List.prototype.sort_jel_mapping = {isLess: 0, key: 1};
List.prototype.max_jel_mapping = {isLess: 0, key: 1};
List.prototype.min_jel_mapping = {isLess: 0, key: 1};


		