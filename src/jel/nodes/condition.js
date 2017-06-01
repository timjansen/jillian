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
    if (JelType.toBoolean(this.condition.execute(ctx)))
      return this.thenExp.execute(ctx);
    else
      return this.elseExp.execute(ctx);
  }
  
  getSerializationProperties() {
    return {condition: this.condition, thenExp: this.thenExp, elseExp: this.elseExp};
  }
}

module.exports = Condition;