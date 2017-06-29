'use strict';

const JelType = require('../type.js');
const JelNode = require('../node.js');

class Get extends JelNode {
  constructor(left, name) {
    super();
    this.left = left;
    this.name = name;
  }
  
  getValue(ctx, left, name) {
    if (left == null)
      return left;
    else if (left.get_jel_mapping)
      return left.get(name);
    else if (name == null)
      return null;
    else 
      return JelType.member(left, name);
  }
   
  execute(ctx) {
    const left = this.left.execute(ctx);
    const name = this.name.execute(ctx);
    if (left instanceof Promise || name instanceof Promise) 
      return Promise.all([left, name]).then(r=>this.getValue(ctx, r[0], r[1]));
    else
      return this.getValue(ctx, left, name);
  }
  
  getSerializationProperties() {
    return {left: this.left, name: this.name};
  }
}

module.exports = Get;