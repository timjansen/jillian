'use strict';

const JelNode = require('../node.js');
const JelType = require('../type.js');

class Condition extends JelNode {
  constructor(condition, thenExp, elseExp) {
    super();
    this.condition = condition;
    this.thenExp = thenExp;
    this.elseExp = elseExp;
  }
  
  // override
  execute(ctx) {
    return this.resolveValue(ctx, v=>this.runOnValue(ctx, v), this.condition.execute(ctx));
  }
  
  // override
  equals(other) {
		return other instanceof Condition &&
      this.condition.equals(other.condition) &&
      this.thenExp.equals(other.thenExp) &&
      this.elseExp.equals(other.elseExp);
	}


  runOnValue(ctx, cond) {
    if (JelType.toBoolean(cond))
      return this.thenExp.execute(ctx);
    else
      return this.elseExp.execute(ctx);
  }

  
  getSerializationProperties() {
    return {condition: this.condition, thenExp: this.thenExp, elseExp: this.elseExp};
  }
}

module.exports = Condition;