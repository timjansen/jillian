'use strict';

const JelNode = require('../node.js');
const JelType = require('../type.js');
const Variable = require('./variable.js');

class Operator extends JelNode {
  constructor(op, left, right) {
    super();
    this.op = op;
    this.left = left;
    this.right = right;
  }
  
  execute(ctx) {
    switch (this.op) {
    case '.':
      if (!(this.right instanceof Variable))
        throw new Error('Operator "." must be followed by an identifier');
      return JelType.member(this.left.execute(ctx), this.right.name);
    case '||':
      return this.or(ctx);
    case '&&':
      return this.and(ctx);
    default:
      if (this.right != null) 
        return JelType.op(this.op, this.left.execute(ctx), this.right.execute(ctx));
      else
        return JelType.singleOp(this.op, this.left.execute(ctx));
    }
  }
  
  and(ctx) {
    const left = this.left.execute(ctx);
    return JelType.toBoolean(left) ? this.right.execute(ctx) : left;
  }
  
  or(ctx) {
    const left = this.left.execute(ctx);
    return JelType.toBoolean(left) ? left : this.right.execute(ctx);
  }
  
  member(ctx) {
  }
  
  getSerializationProperties() {
    if (this.right != null) 
      return {op: this.op, left: this.left, right: this.right};
    else
      return {op: this.op, left: this.left};
  }
}

module.exports = Operator;