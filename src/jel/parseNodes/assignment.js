'use strict';

const JelNode = require('./node.js');
const JelType = require('../type.js');
const JelPattern = require('../pattern.js');
const Pattern = require('./pattern.js');

const EMPTY_MAP = new Map();

class Assignment extends JelNode {
  constructor(name, expression, meta) {
    super();
    this.name = name;
    this.expression = expression;
		this.meta = meta;             // optional array of meta Assignments
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
    return {name: this.name, expression: this.expression, meta: this.meta};
  }
	
	toString(separator='=') {
		if (this.name instanceof JelPattern) {
			const meta = this.meta ? `${this.meta.map(s=>s.toString()).join(', ')}: ` : '';
			return `${meta}${Pattern.toString(this.name)}${separator}${this.expression.toString()}`;
		}
		else
			return `${this.name}${separator}${this.expression.toString()}`;
	}
}

module.exports = Assignment;