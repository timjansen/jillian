'use strict';

const JelType = require('./type.js');
const List = require('./list.js');

/**
 * Dictionary is a map-like type for JEL.
 */
class Dictionary extends JelType {
	constructor(elements, useProvidedMap) {
		super();
		if (useProvidedMap)
			this.elements = elements;
		else {
			this.elements = new Map();
			this.putAll(elements);
		}
	}
	
	op(operator, right) {
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
	
	get(key) {
		return this.elements.get(key);
	}

	has(key) {
		return this.elements.has(key);
	}

	set(key, value) {
		this.elements.set(key, value);
		return this;
	}

	putAll(otherDict) {
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
	
	get anyKey() {
		return this.elements.keys().next().value;
	}
	
	get size() {
		return this.elements.size;
	}

	get keys() {
		return new List(this.elements.keys());
	}
	
	each(f) {
		let i = 0;
		for (let key of this.elements.keys())
			f.invoke(key, this.get(key), i++);
		return this;
	}

	map(f) {
		let i = 0;
		const d = new Dictionary();
		for (let key of this.elements.keys())
			d.set(key, f.invoke(key, this.get(key), i++));
		return d;
	}

	filter(f) {
		let i = 0;
		const d = new Dictionary();
		for (let key of this.elements.keys()) {
			const value = this.get(key);
			if (f.invoke(key, value, i++))
				d.set(key, value);
		}
		return d;
	}
	
	reduce(f, init = 0) {
		let i = 0;
		let a = init;
		for (let key of this.elements.keys())
			a = f.invoke(a, key, this.get(key), i++);
		return a;
	}

	hasAny(f) {
		let i = 0;
		for (let key of this.elements.keys()) {
			const value = this.get(key);
			if (f.invoke(key, value))
				return true;
		}
		return false;
	}

	hasOnly(f) {
		let i = 0;
		for (let key of this.elements.keys()) {
			const value = this.get(key);
			if (!f.invoke(key, value))
				return false;
		}
		return true;
	}

	toObjectDebug() {
		const o = {};
		for (let key of this.elements.keys()) 
			o[key] = this.get(key);
		return o;
	}
	
	toNullable() {
		return this.elements.size ? this : null;
	}
	
	static create(elements) {
		return new Dictionary(elements);
	}
}

Dictionary.empty = new Dictionary();

Dictionary.JEL_PROPERTIES = {empty: 1};
Dictionary.prototype.JEL_PROPERTIES = {size: true, anyKey: true, keys: true};

Dictionary.create_jel_mapping = {elements: 0};

Dictionary.prototype.get_jel_mapping = {key: 0};
Dictionary.prototype.has_jel_mapping = {key: 0};
Dictionary.prototype.each_jel_mapping = {f: 0};
Dictionary.prototype.map_jel_mapping = {f: 0};
Dictionary.prototype.filter_jel_mapping = {f: 0};
Dictionary.prototype.reduce_jel_mapping = {f: 0, init: 1};
Dictionary.prototype.hasAny_jel_mapping = {f: 0};
Dictionary.prototype.hasOnly_jel_mapping = {f: 0};

module.exports = Dictionary;

		