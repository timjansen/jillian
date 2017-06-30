'use strict';

const JelNode = require('../node.js');
const DbRef = require('../../database/dbref.js');

// a @Name ref
class Reference extends JelNode {
  constructor(name) {
    super();
    this.name = name;
  }
  
  execute(ctx) {
    if (this.ref)
      return this.ref;

    if (!ctx.dbSession)
      return new DbRef(this.name);

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