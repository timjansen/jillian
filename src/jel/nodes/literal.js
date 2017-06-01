'use strict';

const JelNode = require('../node.js');

class Literal extends JelNode {
  constructor(value) {
    super();
    this.value = value;
  }
  
  execute(ctx) {
    return this.value;
  }
  
  getSerializationProperties() {
    return {value: this.value};
  }
}

module.exports = Literal;