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
  
  call(ctx, callable) {
    const newArgs = this.argList.map(a=>a.execute(ctx));
    const newArgObj = {};
    this.namedArgs.forEach(a => newArgObj[a.name] = a.execute(ctx));
    return callable.invokeWithObject(newArgs, newArgObj);
  }
  
  execute(ctx) {
    const left = this.left.execute(ctx);
    if (left instanceof Callable) 
      return this.call(ctx, left);
    else if (JelType.isPrototypeOf(left)) {
      const callable = JelType.member(left, 'create');
      if (callable)
        return this.call(ctx, callable);
      throw new Error(`Call failed. Tried to call a JEL type that does not support creation.`);
    }
    else if (left == null) 
      return null;
  }
  
  getSerializationProperties() {
    return {left: this.left, argList: this.argList, argObj: this.argObj};
  }
}

module.exports = Call;