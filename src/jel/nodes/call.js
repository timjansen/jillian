'use strict';

const JelType = require('../type.js');
const JelNode = require('../node.js');
const Callable = require('../callable.js');

class Call extends JelNode {
  constructor(left, argList = [], namedArgs = []) {
    super();
    this.left = left;
    this.argList = argList;     // array of expression
    this.namedArgs = namedArgs; // array of Assignment
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
      if (!callable)
        throw new Error(`Call failed. Tried to create '${left.constructor.name}', but it does not support creation. It needs a public create() method.`);
      return this.callCallable(ctx, callable);
    }
    else if (left == null) 
      return null;
  }
  
  // override
  execute(ctx) {
    return this.resolveValue(ctx, v=>this.callLeft(ctx, v), this.left.execute(ctx));
  }
  
  // overrride
  equals(other) {
		return other instanceof Call &&
      this.left.equals(other.left) &&
      this.argList.length == other.argList.length &&
      this.namedArgs.length == other.namedArgs.length && 
      !this.argList.find((l, i)=>!l.equals(other.argList[i])) &&
      !this.namedArgs.find((l, i)=>!l.equals(other.namedArgs[i]));
	}

  
  getSerializationProperties() {
    return {left: this.left, argList: this.argList, argObj: this.argObj};
  }
}

module.exports = Call;