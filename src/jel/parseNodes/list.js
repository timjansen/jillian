'use strict';

const JelNode = require('./node.js');
const JelList = require('../list.js');

class List extends JelNode {
  constructor(elements) {
    super();
    this.elements = elements;
  }

  // override
  execute(ctx) { 
    return new JelList(this.elements.map(e=>e.execute(ctx)));
  }
  
  // override
  equals(other) {
		return other instanceof List &&
      this.elements.length == other.elements.length && 
      !this.elements.find((l, i)=>!l.equals(other.elements[i]));
	}

  toString() {
		return `{${this.elements.map(s=>s.toString()).join(', ')}}`;
	}  
	
  getSerializationProperties() {
    return {elements: this.elements};
  }
}

module.exports = List;