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
		this.frame = {};
		this.context = new Context(this.frame, this.parentContext);
  }
  
	invokeWithObject(args, argObj, ctx) {   // context will be ignored for lambda. No promise support here, only in Call.
    args.forEach((arg, i) => this.frame[this.argNames[i]] = args[i]);
		for (let i = args.length; i < this.argNames.length; i++)
			this.frame[this.argNames[i]] = undefined;
		if (argObj)
			for (let name in argObj)
				this.frame[name] = argObj[name];
    return this.expression.execute(this.context);
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