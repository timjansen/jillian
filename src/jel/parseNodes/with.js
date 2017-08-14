'use strict';

const JelNode = require('./node.js');
const Context = require('../context.js');

class With extends JelNode {
  constructor(assignments, expression) {
    super();
    this.assignments = assignments;
    this.expression = expression;
  }
  
  // override
  execute(ctx) {
    const frame = {};
    const newCtx = new Context(frame, ctx);
    this.assignments.forEach(a => frame[a.name] = a.execute(newCtx));
    return this.expression.execute(newCtx);
  }

  // override
  equals(other) {
		return other instanceof With &&
			this.expression.equals(other.expression) && 
      this.assignments.length == other.assignments.length && 
      !this.assignments.find((l, i)=>!l.equals(other.assignments[i]));
	}
  
	toString() {
		return `with ${this.assignments.map(s=>s.toString()).join(', ')}): ${this.expression.toString()}`;		
	}
	
  getSerializationProperties() {
    return {assignments: this.assignments, expression: this.expression};
  }
}

module.exports = With;