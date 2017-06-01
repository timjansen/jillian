'use strict';

const JelNode = require('../node.js');
const JelType = require('../type.js');

class Operator extends JelNode {
  constructor(op, left, right) {
    super();
    this.op = op;
    this.left = left;
    this.right = right;
  }
  
  execute(ctx) {
    if (this.right != null) 
      return JelType.op(this.op, this.left.execute(ctx), this.right.execute(ctx));
    else
      return JelType.singleOp(this.op, this.left.execute(ctx));
  }
  
  getSerializationProperties() {
    if (this.right != null) 
      return {op: this.op, left: this.left, right: this.right};
    else
      return {op: this.op, left: this.left};
  }
}

module.exports = Operator;