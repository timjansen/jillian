'use strict';

const JelNode = require('../node.js');
const JelType = require('../type.js');

class Assignment extends JelNode {
  constructor(name, expression) {
    super();
    this.name = name;
    this.expression = expression;
  }

  // override
  execute(ctx) {
      return this.expression.execute(ctx);
  }
  
  // override
  equals(other) {
		return other instanceof Assignment &&
      this.name == other.name &&
      this.expression.equals(other.expression);
	}

  
  getSerializationProperties() {
    return {name: this.name, expression: this.expression};
  }
}

module.exports = Assignment;