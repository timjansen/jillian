'use strict';

const JelNode = require('./node.js');
const JelType = require('../type.js');
const Variable = require('./variable.js');
const Util = require('../../util/util.js');

class Operator extends JelNode {
  constructor(op, left, right) {
    super();
    this.op = op;
    this.left = left;
    this.right = right;
  }

  // override
  execute(ctx) {
    switch (this.op) {
    case '.':
    case '||':
    case '&&':
      return this.evaluateLeftFirstOp(ctx);

    default:
      if (this.right == null)
        return this.evaluateLeftFirstOp(ctx);
        
      return Util.resolveValues((l,r)=>JelType.op(this.op, l, r), this.left.execute(ctx), this.right.execute(ctx));
      }
  }

  evaluateLeftFirstOp(ctx) {
    return Util.resolveValue(left=>this.leftFirstOps(ctx, left), this.left.execute(ctx));
  }
  
  leftFirstOps(ctx, left) {
    switch (this.op) {
    case '.':
      return this.callMethod(ctx, left);
    case '||':
      return this.or(ctx, left);
    case '&&':
      return this.and(ctx, left);
    default: 
      return JelType.singleOp(this.op, left);
    }
  }
  
  callMethod(ctx, left) {
    if (!(this.right instanceof Variable))
        throw new Error('Operator "." must be followed by an identifier');
      return JelType.member(left, this.right.name);
  }
  
  binaryOp(ctx, left, right) {
      return JelType.op(this.op, left, right);
  }
  
  and(ctx, left) {
    return JelType.toBoolean(left) ? this.right.execute(ctx) : left;
  }
  
  or(ctx, left) {
    return JelType.toBoolean(left) ? left : this.right.execute(ctx);
  }
  
  
  // overrride
  equals(other) {
		return other instanceof Operator &&
      this.op == other.op && 
      this.left.equals(other.left) &&
      (!this.right == !other.right) &&
      ((!this.right) || (this.right.equals(other.right)));
	}
  
	toString() {
		if (this.right) {
			if (this.op == '.')
				return `${this.left.toString()}.${this.right.toString()}`;
			else
				return `(${this.left.toString()} ${this.op} ${this.right.toString()})`;
		}
		else
			return `${this.op}(${this.left.toString()})`;
	}
	
  getSerializationProperties() {
    if (this.right != null) 
      return {op: this.op, left: this.left, right: this.right};
    else
      return {op: this.op, left: this.left};
  }
}

module.exports = Operator;