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
    const newArgs = this.argList.map(a=>a.execute(ctx));
    const newArgObj = {};
    this.namedArgs.forEach(a => newArgObj[a.name] = a.execute(ctx));

    function call2() {
      if (newArgs.findIndex(a=>a instanceof Promise) < 0)
        return callable.invokeWithObject(newArgs, newArgObj, ctx);
      else
        return Promise.all(newArgs).then(args=>callable.invokeWithObject(args, newArgObj, ctx));
    }
    
    if (this.namedArgs.findIndex(a=>newArgObj[a.name] instanceof Promise) < 0)
      return call2();
    else 
      return Promise.all(this.namedArgs.map(a=>newArgObj[a.name]))
      .then(pa=> {
        this.namedArgs.forEach((a,i)=>newArgObj[a.name] = pa[i]); 
        return call2();
      });
  }
  
  callValue(ctx, left) {
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
    const left = this.left.execute(ctx);
    if (left instanceof Promise) 
      return left.then(v=>this.callValue(ctx, v));
    else
      return this.callValue(ctx, left);
  }
  
  getSerializationProperties() {
    return {left: this.left, argList: this.argList, argObj: this.argObj};
  }
}

module.exports = Call;