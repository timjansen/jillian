'use strict';

const Util = require('../util/util.js');

/**
 * Manages the context containing all variables.
 */
class Context {

	constructor(parent = null, dbSession = null, translationDict = null) {
		this.parent = parent;
		this.dbSession = dbSession || (parent && parent.dbSession);
		this.translationDict = translationDict || (parent && parent.translationDict);
		this.frame = {};
		this.frozen = false;
	}
	
	get(name) {
		if (this.frame.hasOwnProperty(name))
				return this.frame[name];
		if (this.parent)
			return this.parent.get(name);
		throw new Error(`Can not read unknown variable ${name}.\n${this.toString()}`);
	}
	
	set(name, value) {
		if (this.frozen)
			throw new Error('Can not modify context, already frozen');
		this.frame[name] = value;
		return this;
	}
	
	setAll(obj) {
		if (obj)
			for (const name in obj) 
				this.set(name, obj[name]);
		return this.freeze();
	}
	
	freeze() {
		this.frozen = true;
		return this;
	}
	
	toString() {
		const vars = Util.propertyNames(this.frame).map(n=>`${n}=${this.frame[n]}`).join(', ');
		return `Context(frame={${vars}}, dbSession=${!!this.dbSession}, translationDict=${!!this.translationDict}, \n   parent=${this.parent})`;
	}
}

module.exports = Context;