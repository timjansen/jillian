'use strict';

const JelNode = require('../node.js');
const DbRef = require('../../database/dbref.js');

// a @Name ref
class Reference extends JelNode {
  constructor(name) {
    super();
    this.name = name;
    this.ref = new DbRef(this.name);
  }
  
  execute(ctx) {
    return this.ref;
  }
  
  getSerializationProperties() {
    return {name: this.name};
  }
}

module.exports = Reference;