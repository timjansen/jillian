'use strict';

const JelNode = require('../node.js');

class Reference extends JelNode {
  constructor(name) {
    super();
    this.name = name;
  }
  
  execute(ctx) {
    throw new Error('Reference not implemented yet');
  }
  
  getSerializationProperties() {
    return {name: this.name};
  }
}

module.exports = Reference;