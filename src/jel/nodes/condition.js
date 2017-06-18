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
  
  execute(ctx) {
    const c = this.condition.execute(ctx);
    if (c instanceof Promise)
      return c.then(r=>this.runOnValue(ctx, r));
    else
      return this.runOnValue(ctx, c);
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