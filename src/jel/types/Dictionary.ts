import JelType from '../JelType';
import List from './List';
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
	
	op(operator: string, right: any): any {
		if (right == null)
			return this;
		if (right instanceof Dictionary) {
			switch(operator) {
				case '==':
				case '===':
					if (this.size != right.size)
						return false;
					for (let key of this.elements.keys())
						if (!right.has(key) || !JelType.op(operator, this.get(key), right.get(key)))
							return false;
					return true;
			}
		}
		super.op(operator, right);
	}
	
	get_jel_mapping: Object;
	get(key: any): any {
		return this.elements.get(key);
	}

	has_jel_mapping: Object;
	has(key: any): boolean {
		return this.elements.has(key);
	}

	set_jel_mapping: Object;
	set(key: any, value: any): Dictionary {
		this.elements.set(key, value);
		return this;
	}

	putAll_jel_mapping: Object;
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
	each(f: Callable | ((key: string, value: any, index: number)=>void)): Dictionary {
		let i = 0;
		if (typeof f == 'function')
			this.elements.forEach((value, key) => f(key, value, i++));
		else
			this.elements.forEach((value, key) => f.invoke(key, value, i++));
		return this;
	}

	map_jel_mapping: Object;
	map(f: Callable): Dictionary {
		let i = 0;
		const d = new Dictionary();
		this.elements.forEach((value, key) => d.set(key, f.invoke(key, value, i++)));
		return d;
	}

	filter_jel_mapping: Object;
	filter(f: Callable): Dictionary {
		let i = 0;
		const d = new Dictionary();
		this.elements.forEach((value, key) => {
			if (f.invoke(key, value, i++))
				d.set(key, value);
		});
		return d;
	}
	
	reduce_jel_mapping: Object;
	reduce(f: Callable, init: any = 0): any {
		let i = 0;
		let a = init;
		for (let key of this.elements.keys())
			a = f.invoke(a, key, this.get(key), i++);
		return a;
	}

	hasAny_jel_mapping: Object;
	hasAny(f: Callable): boolean {
		let i = 0;
		for (let key of this.elements.keys()) {
			const value = this.get(key);
			if (f.invoke(key, value))
				return true;
		}
		return false;
	}

	hasOnly_jel_mapping: Object;
	hasOnly(f: Callable): boolean {
		let i = 0;
		for (let key of this.elements.keys()) {
			const value = this.get(key);
			if (!f.invoke(key, value))
				return false;
		}
		return true;
	}

	toObjectDebug(): any {
		const o: any = {};
		this.elements.forEach((value, key) => o[key] = value);
		return o;
	}
	
	toNullable(): Dictionary | null {
		return this.elements.size ? this : null;
	}
	
	static create_jel_mapping = {elements: 0};
	static create(...args: any[]): any {
		return new Dictionary(args[0]);
	}
}


Dictionary.prototype.JEL_PROPERTIES = {size: true, anyKey: true, keys: true};
Dictionary.prototype.get_jel_mapping = {key: 0};
Dictionary.prototype.has_jel_mapping = {key: 0};
Dictionary.prototype.each_jel_mapping = {f: 0};
Dictionary.prototype.map_jel_mapping = {f: 0};
Dictionary.prototype.filter_jel_mapping = {f: 0};
Dictionary.prototype.reduce_jel_mapping = {f: 0, init: 1};
Dictionary.prototype.hasAny_jel_mapping = {f: 0};
Dictionary.prototype.hasOnly_jel_mapping = {f: 0};

		