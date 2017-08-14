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
    const t = new JelTranslator();
    this.elements.forEach(e=>t.addPattern(e.name, e.execute(ctx), e.getMetaData(ctx)));
    return t;
  }
  
  // override
  equals(other) {
		return other instanceof Translator &&
      this.elements.length == other.elements.length && 
      !this.elements.find((l, i)=>!l.equals(other.elements[i]));
	}

  toString() {
		return `@${this.name}`;	
	}
	
  getSerializationProperties() {
    return {elements: this.elements};
  }
}

module.exports = Translator;