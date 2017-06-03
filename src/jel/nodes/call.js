'use strict';

const JelNode = require('../node.js');
const Callable = require('../callable.js');

class Call extends JelNode {
  constructor(left, argList = [], namedArgs = []) {
    super();
    this.left = left;
    this.argList = argList;
    this.namedArgs = namedArgs; // list of Assignments
  }
  
  execute(ctx) {
    const left = this.left.execute(ctx);
    if (left instanceof Callable) {
      const newArgs = this.argList.map(a=>a.execute(ctx));
      const newArgObj = {};
      this.namedArgs.forEach(a => newArgObj[a.name] = a.execute(ctx));
      return left.invoke(newArgs, newArgObj);
    }
    if (left == null)
      return null;
    throw new Error(`Call failed. Not a type that can be invoked.`);
  }
  
  getSerializationProperties() {
    return {left: this.left, argList: this.argList, argObj: this.argObj};
  }
}

module.exports = Call;