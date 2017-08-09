'use strict';

const JelNode = require('./node.js');
const JelTranslator = require('../translator.js');

class Translator extends JelNode {
  constructor(elements = []) {
    super();
    this.elements = elements; // array of assignments
  }

  // override
  execute(ctx) {
    const map = new JelTranslator();
    this.elements.forEach(e=>map.addPattern(e.name, e.execute(ctx), e.getMetaData(ctx)));
    return map;
  }
  
  // override
  equals(other) {
		return other instanceof Translator &&
      this.elements.length == other.elements.length && 
      !this.elements.find((l, i)=>!l.equals(other.elements[i]));
	}

  
  getSerializationProperties() {
    return {elements: this.elements};
  }
}

module.exports = Translator;