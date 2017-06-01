'use strict';

const JelNode = require('../node.js');

class List extends JelNode {
  constructor(elements) {
    super();
    this.elements = elements;
  }
  
  execute(ctx) { 
    return this.elements.map(e=>e.execute(ctx));
  }
  
  getSerializationProperties() {
    return {elements: this.elements};
  }
}

module.exports = List;