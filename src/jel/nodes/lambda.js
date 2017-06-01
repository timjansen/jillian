'use strict';

const JelNode = require('../node.js');
const Callable = require('../callable.js');
const Context = require('../context.js');

class LambdaCallable extends Callable {
  constructor(argNames, expression, context) {
		super();
    this.argNames = argNames;
    this.expression = expression;
    this.context = context;
  }
  
	invoke(args, argObj) {
    const frame = {};
    args.forEach((arg, i) => frame[this.argNames[i]] = args[i]);
    for (let name in argObj)
      frame[name] = argObj[name];
    return this.expression.execute(new Context(frame, this.context));
	}
}

class Lambda extends JelNode {
  constructor(argNames, expression) {
		super();
    this.argNames = argNames; // list of argument names
    this.expression = expression;   
  }
  
  execute(ctx) {
    return new LambdaCallable(this.argNames, this.expression, ctx);
  }
  
  getSerializationProperties() {
    return {argNames: this.argNames, expression: this.expression};
  }
}

module.exports = Lambda;