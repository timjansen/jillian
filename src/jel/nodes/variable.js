'use strict';

const JelNode = require('../node.js');

class Variable extends JelNode {
  constructor(name) {
    super();
    this.name = name;
  }
  
  execute(ctx) {
    return ctx.get(this.name);
  }
  
  getSerializationProperties() {
    return {name: this.name};
  }
}

module.exports = Variable;