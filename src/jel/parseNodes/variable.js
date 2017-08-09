'use strict';

const JelNode = require('./node.js');

class Variable extends JelNode {
  constructor(name) {
    super();
    this.name = name;
  }
  
  // override
  execute(ctx) {
    return ctx.get(this.name);
  }
  
  // overrride
  equals(other) {
		return other instanceof Variable &&
      this.name == other.name;
	}

  
  getSerializationProperties() {
    return {name: this.name};
  }
}

module.exports = Variable;