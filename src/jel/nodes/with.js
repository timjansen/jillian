'use strict';

const JelNode = require('../node.js');
const Context = require('../context.js');

class With extends JelNode {
  constructor(assignments, expression) {
    super();
    this.assignments = assignments;
    this.expression = expression;
  }
  
  execute(ctx) {
    const frame = {};
    const newCtx = new Context(frame, ctx);
    this.assignments.forEach(a => frame[a.name] = a.execute(newCtx));
    return this.expression.execute(newCtx);
  }
  
  getSerializationProperties() {
    return {assignments: this.assignments, expression: this.expression};
  }
}

module.exports = With;