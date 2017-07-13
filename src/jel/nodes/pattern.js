'use strict';

const JelNode = require('../node.js');

class Pattern extends JelNode {
  constructor(pattern) {
    super();
    this.pattern = pattern;
  }
  
  execute(ctx) {
    return this.pattern;
  }
  
  getSerializationProperties() {
    return {pattern: this.pattern};
  }
}

module.exports = Pattern;