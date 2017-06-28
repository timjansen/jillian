'use strict';

const JelNode = require('../node.js');
const JelDictionary = require('../dictionary.js');

class Dictionary extends JelNode {
  constructor(elements = []) {
    super();
    this.elements = elements;
  }
  
  execute(ctx) {
    const map = new Map();
    this.elements.forEach(a => map.set(a.name, a.execute(ctx)));
    return new JelDictionary(map, true);
  }
  
  getSerializationProperties() {
    return {elements: this.elements};
  }
}

module.exports = Dictionary;