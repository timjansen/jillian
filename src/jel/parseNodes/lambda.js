'use strict';

const JelNode = require('./node.js');
const Callable = require('../callable.js');
const Context = require('../context.js');

const NO_ARG = {};

class LambdaCallable extends Callable {
  constructor(argNames, expression, parentContext, name) {
		super();
    this.argNames = argNames; // list of argument names
    this.expression = expression;
    this.parentContext = parentContext;
		this.name = name;
  }
  
	invokeWithObject(args, argObj, ctx) {   // context will be ignored for lambda. No promise support here, only in Call.
		const newCtx = new Context(this.parentContext);
    args.forEach((arg, i) => newCtx.set(this.argNames[i], args[i]));
		for (let i = args.length; i < this.argNames.length; i++)
			newCtx.set(this.argNames[i], undefined);
		if (argObj)
			for (let name in argObj)
				newCtx.set(name, argObj[name]);
		newCtx.freeze();
    return this.expression.execute(newCtx);
	}
	
	invoke(...args) {
		return this.invokeWithObject(args);
	}

	invokeWithContext(ctx, ...args) {  // ctx will be ignored for lambda
		return this.invokeWithObject(args);
	}

	toString() {
		if (this.argNames.length == 1)
			return `${this.argNames[0]}=>${this.expression.toString()}`;
		else
			return `(${this.argNames.join(', ')})=>${this.expression.toString()}`;
	}
}

class Lambda extends JelNode {
  constructor(argNames, expression) {
		super();
    this.argNames = argNames; // array of argument names
    this.expression = expression;   
  }
  
	// override
  execute(ctx) {
    return new LambdaCallable(this.argNames, this.expression, ctx, "(anon lambda)");
	}
	
	// override
  equals(other) {
		return other instanceof Lambda &&
			this.expression.equals(other.expression) && 
      this.argNames.length == other.argNames.length && 
      !this.argNames.find((l, i)=>l != other.argNames[i]);
	}

	toString() {
		if (this.argNames.length == 1) 
			return `${this.argNames[0]}=>${this.expression.toString()}`;
		else
			return `(${this.argNames.join(', ')})=>${this.expression.toString()}`;		
	}
	
  getSerializationProperties() {
    return {argNames: this.argNames, expression: this.expression};
  }
}

module.exports = Lambda;