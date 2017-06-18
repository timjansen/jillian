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
    const left = this.left.execute(ctx);
    if (left instanceof Promise)
      return left.then(value=>this.runOnValue(ctx, value));
    else
      return this.runOnValue(ctx, left);
  }
  
  runOnValue(ctx, left) {
    switch (this.op) {
    case '.':
      if (!(this.right instanceof Variable))
        throw new Error('Operator "." must be followed by an identifier');
      return JelType.member(left, this.right.name);
    case '||':
      return this.or(ctx, left);
    case '&&':
      return this.and(ctx, left);
    default:
      if (this.right != null) {
        const right = this.right.execute(ctx);
        if (right instanceof Promise)
          return right.then(value=>JelType.op(this.op, left, value));
        else
          return JelType.op(this.op, left, right);
      }
      else
        return JelType.singleOp(this.op, left);
    }
  }
  
  and(ctx, left) {
    return JelType.toBoolean(left) ? this.right.execute(ctx) : left;
  }
  
  or(ctx, left) {
    return JelType.toBoolean(left) ? left : this.right.execute(ctx);
  }
  
  
  getSerializationProperties() {
    if (this.right != null) 
      return {op: this.op, left: this.left, right: this.right};
    else
      return {op: this.op, left: this.left};
  }
}

module.exports = Operator;