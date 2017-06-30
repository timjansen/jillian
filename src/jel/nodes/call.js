'use strict';

const JelType = require('../type.js');
const JelNode = require('../node.js');
const Callable = require('../callable.js');

class Call extends JelNode {
  constructor(left, argList = [], namedArgs = []) {
    super();
    this.left = left;
    this.argList = argList;
    this.namedArgs = namedArgs; // list of Assignments
  }
  
  callCallable(ctx, callable) {
    const args = this.argList.map(a=>a.execute(ctx));
    const argObjValues = this.namedArgs.map(a=>a.execute(ctx));

    return this.resolveValueObj(ctx, 
                                objArgs=>this.resolveValues(ctx, (...listArgs)=>callable.invokeWithObject(listArgs, objArgs, ctx), ...args),
                                this.namedArgs, argObjValues);
  }
  
  callLeft(ctx, left) {
    if (left instanceof Callable) 
      return this.callCallable(ctx, left);
    else if (JelType.isPrototypeOf(left)) {
      const callable = JelType.member(left, 'create');
      if (callable)
        return this.callCallable(ctx, callable);
      throw new Error(`Call failed. Tried to call a JEL type that does not support creation.`);
    }
    else if (left == null) 
      return null;
  }
  
  execute(ctx) {
    return this.resolveValue(ctx, v=>this.callLeft(ctx, v), this.left.execute(ctx));
  }
  
  getSerializationProperties() {
    return {left: this.left, argList: this.argList, argObj: this.argObj};
  }
}

module.exports = Call;