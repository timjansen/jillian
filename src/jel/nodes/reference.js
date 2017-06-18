'use strict';

const JelNode = require('../node.js');

class Reference extends JelNode {
  constructor(name) {
    super();
    this.name = name;
  }
  
  execute(ctx) {
    if (this.ref)
      return this.ref;
    if (!ctx.dbSession)
      throw new Error('Reference requires a database session in the Context.');
    this.ref = ctx.dbSession.get(this.name);
    if (!this.ref)
      throw new Error(`Can not find ref ${this.ref} in database.`);
    return this.ref;
  }
  
  getSerializationProperties() {
    return {name: this.name};
  }
}

module.exports = Reference;