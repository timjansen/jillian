'use strict';

const JelNode = require('../node.js');
const JelList = require('../list.js');

class List extends JelNode {
  constructor(elements) {
    super();
    this.elements = elements;
  }
  
  execute(ctx) { 
    return new JelList(this.elements.map(e=>e.execute(ctx)));
  }
  
  getSerializationProperties() {
    return {elements: this.elements};
  }
}

module.exports = List;