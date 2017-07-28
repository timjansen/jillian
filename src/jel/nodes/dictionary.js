'use strict';

const JelNode = require('../node.js');
const JelDictionary = require('../dictionary.js');

class Dictionary extends JelNode {
  constructor(elements = []) {
    super();
    this.elements = elements; // array of assignments
  }

  // override
  execute(ctx) {
    const map = new Map();
    this.elements.forEach(a => map.set(a.name, a.execute(ctx)));
    return new JelDictionary(map, true);
  }
  
  // override
  equals(other) {
		return other instanceof Dictionary &&
      this.elements.length == other.elements.length && 
      !this.elements.find((l, i)=>!l.equals(other.elements[i]));
	}

  
  getSerializationProperties() {
    return {elements: this.elements};
  }
}

module.exports = Dictionary;