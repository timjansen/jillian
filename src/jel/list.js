const JelType = require('./type.js');

/**
 * List is an immutable array-like object that is accessible from JEL.
 */
class List extends JelType {
	constructor(elements = []) {
		super();
		this.elements = elements instanceof List ? elements.elements : Array.prototype.slice.call(elements);
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
	
 getSerializationProperties() {
    return {elements: this.elements};
  }

	static create(elements) {
		return new List(elements);
	}
}

List.create_jel_mapping = {elements: 0};

List.prototype.JEL_PROPERTIES = {first:1, last: 1, length: 1};

List.prototype.get_jel_mapping = {index: 0};
List.prototype.each_jel_mapping = {f: 0};
List.prototype.map_jel_mapping = {f: 0};
List.prototype.filter_jel_mapping = {f: 0};
List.prototype.reduce_jel_mapping = {f: 0, init: 1};
List.prototype.hasAny_jel_mapping = {f: 0};
List.prototype.hasOnly_jel_mapping = {f: 0};

module.exports = List;

		