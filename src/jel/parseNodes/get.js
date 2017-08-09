'use strict';

const JelType = require('../type.js');
const JelNode = require('./node.js');

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
   
  // override
  execute(ctx) {
    return this.resolveValues(ctx, (l,n)=>this.getValue(ctx, l, n), this.left.execute(ctx), this.name.execute(ctx));
  }
  
  // override
  equals(other) {
		return other instanceof Get &&
      this.name == other.name && 
      this.left.equals(other.left);
	}
  
  getSerializationProperties() {
    return {left: this.left, name: this.name};
  }
}

module.exports = Get;