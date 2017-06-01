'use strict';

const JelNode = require('../node.js');
const JelType = require('../type.js');

class Assignment extends JelNode {
  constructor(name, expression) {
    super();
    this.name = name;
    this.expression = expression;
  }
  
  execute(ctx) {
      return this.expression.execute(ctx);
  }
  
  getSerializationProperties() {
    return {name: this.name, expression: this.expression};
  }
}

module.exports = Assignment;