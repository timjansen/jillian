'use strict';

const JelNode = require('./node.js');
const JelType = require('../type.js');

const EMPTY_MAP = new Map();

class Assignment extends JelNode {
  constructor(name, expression, meta) {
    super();
    this.name = name;
    this.expression = expression;
		this.meta = meta;             // optional array of meta assignments
  }

  // override
  execute(ctx) {
      return this.expression.execute(ctx);
  }
 
	getMetaData(ctx) {
		if (!this.meta)
			return EMPTY_MAP;
		
		const m = new Map();
		this.meta.forEach(e=>m.set(e.name, e.execute(ctx)));
		return m;
	}
	
  // override
  equals(other) {
		if (!(other instanceof Assignment))
			return false;
		if (this.meta) {
			if ((!this.meta) != (!other.meta))
				return false;
			if (this.meta.length != other.meta.length)
				return false;
			
			for (let i = 0; i < this.meta.length; i++)
				if (!this.meta[i].equals(other.meta[i]))
					return false;
		}
		return this.name == other.name && this.expression.equals(other.expression);
	}
  
  getSerializationProperties() {
    return {name: this.name, expression: this.expression};
  }
}

module.exports = Assignment;