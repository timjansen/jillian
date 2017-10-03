import JelType from './JelType';
import Callable from './Callable';
import Gettable from './Gettable';

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
					// TODO
					break;
			}
		}
		super.op(operator, right);
	}
	
	get_jel_mapping: Object;
	get(index: any): any {
		return this.elements[index];
	}
	
	get first(): any {
		return this.elements[0];
	}

	get last(): any {
		return this.elements[this.elements.length-1];
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
		return new List(this.elements.filter((a,i)=>f.invoke(a,i)));
	}
	
	reduce_jel_mapping: Object;
	reduce(f: Callable, init: any): any {
		return this.elements.reduce((a,e,i)=>f.invoke(a,e,i), init);
	}

	hasAny_jel_mapping: Object;
	hasAny(f: Callable): boolean {
		for (let i = 0; i < this.elements.length; i++)
			if (f.invoke(this.elements[i], i))
				return true;
		return false;
	}

	hasOnly_jel_mapping: Object;
	hasOnly(f: Callable): boolean {
		for (let i = 0; i < this.elements.length; i++)
			if (!f.invoke(this.elements[i], i))
				return false;
		return true;
	}
	
	// isBetter(a,b) checks whether a is better than b (must return false is both are equally good)
	bestMatch_jel_mapping: Object;
	bestMatch(isBetter: Callable): List {
		if (!this.elements.length)
			return List.empty;
		
		const l = [this.first];
		for (let i = 1; i < this.elements.length; i++) {
			const e = this.elements[i];
			if (!isBetter.invoke(l[0], e)) {
				if (isBetter.invoke(e, l[0]))
					l.splice(0, this.elements.length, e);
				else
					l.push(e);
			}
		}
		return new List(l);
	}
	
	sub_jel_mapping: Object;
	sub(start?: number, end?: number) {
		return new List(this.elements.slice(start, end));
	}
	
	// isLess(a, b) checks whether a<b . If equal, is must return false. If a==b, then !isLess(a,b)&&!isLess(b,a)
	sort_jel_mapping: Object;
	sort(isLess: Callable): List {
		const l = Array.prototype.slice.call(this.elements);
		l.sort((a, b)=>isLess.invoke(a,b) ? -1 : (isLess.invoke(b,a) ? 1 : 0));
		return new List(l);
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
List.prototype.bestMatch_jel_mapping = {isBetter: 0};
List.prototype.sub_jel_mapping = {start: 0, end: 1};
List.prototype.sort_jel_mapping = {isLess: 0};


		