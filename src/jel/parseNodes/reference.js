'use strict';

const JelNode = require('./node.js');
const DbRef = require('../../database/dbref.js');

// a @Name ref
class Reference extends JelNode {
  constructor(name) {
    super();
    this.name = name;
    this.ref = new DbRef(this.name);
  }
  
  // override
  execute(ctx) {
    return this.ref;
  }
  
  // overrride
  equals(other) {
		return other instanceof Reference &&
      this.name == other.name;
	}
  
	toString() {
		return `@${this.name}`;	
	}
	
  getSerializationProperties() {
    return {name: this.name};
  }
}

module.exports = Reference;