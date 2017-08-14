'use strict';

const JelNode = require('./node.js');

class Literal extends JelNode {
  constructor(value) {
    super();
    this.value = value;
  }
  
  // override
  execute(ctx) {
    return this.value;
  }
  
  // override
  equals(other) {
		return other instanceof Literal &&
      this.value == other.value;
	}
  
	toString() {
		return JSON.stringify(this.value);
	}  
	
  getSerializationProperties() {
    return {value: this.value};
  }
}

Literal.TRUE = new Literal(true);

module.exports = Literal;