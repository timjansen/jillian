const JelType = require('./type.js');

/**
 * List is an immutable array-like object that is accessible from JEL.
 */
class List extends JelType {
	constructor(elements = []) {
		super();
		this.elements = elements instanceof List ? elements.elements : elements instanceof Array ? elements : Array.prototype.slice.call(elements);
	}
	
	op(operator, right) {
		if (right == null)
			return this;
		if (right instanceof List) {
			switch(operator) {
				case '==':
					break;
			}
		}
		super.op(operator, right);
	}
	
	get(index) {
		return this.elements[index];
	}
	
	get first() {
		return this.elements[0];
	}

	get last() {
		return this.elements[this.elements.length-1];
	}
	
	get length() {
		return this.elements.length;
	}
	
	each(f) {
		this.elements.forEach((a,i)=>f.invoke(a,i));
	}

	map(f) {
		return new List(this.elements.map((a,i)=>f.invoke(a,i)));
	}

	filter(f) {
		return new List(this.elements.filter((a,i)=>f.invoke(a,i)));
	}
	
	reduce(f, init) {
		return this.elements.reduce((a,e,i)=>f.invoke(a,e,i), init);
	}

	hasAny(f) {
		for (let i = 0; i < this.elements.length; i++)
			if (f.invoke(this.elements[i], i))
				return true;
		return false;
	}

	hasOnly(f) {
		for (let i = 0; i < this.elements.length; i++)
			if (!f.invoke(this.elements[i], i))
				return false;
		return true;
	}
	
	// isBetter(a,b) checks whether a is better than b (must return false is both are equally good)
	bestMatch(isBetter) {
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
	
	sub(start, end) {
		return new List(this.elements.slice(start, end));
	}
	
	// isLess(a, b) checks whether a<b . If equal, is must return false. If a==b, then !isLess(a,b)&&!isLess(b,a)
	sort(isLess) {
		const l = Array.prototype.slice.call(this.elements);
		l.sort((a, b)=>isLess.invoke(a,b) ? -1 : (isLess.invoke(b,a) ? 1 : 0));
		return new List(l);
	}
	
	getSerializationProperties() {
    return {elements: this.elements};
	}

	static create(elements) {
		return new List(elements);
	}
}

List.empty = new List();

List.JEL_PROPERTIES = {empty: 1};
List.prototype.JEL_PROPERTIES = {first:1, last: 1, length: 1};

List.create_jel_mapping = {elements: 0};

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

module.exports = List;

		