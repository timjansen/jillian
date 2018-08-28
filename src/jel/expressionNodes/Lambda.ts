import JelNode from './JelNode';
import JelType from '../JelType';
import Context from '../Context';
import Callable from '../Callable';
import Util from '../../util/Util';


class LambdaCallable extends Callable {
  constructor(public argNames: string[], public expression: JelNode, public parentContext: Context, public name?: string) {
		super();
  }
 
	invokeWithObject(ctx: Context, args: any[], argObj?: any): any {   // context will be ignored for lambda. No promise support here, only in Call.
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
	
	invoke(ctx: Context, ...args: any[]): any {
		return this.invokeWithObject(ctx, args);
	}

	toString(): string {
		if (this.argNames.length == 1)
			return `${this.argNames[0]}=>${this.expression.toString()}`;
		else
			return `(${this.argNames.join(', ')})=>${this.expression.toString()}`;
	}
}

/**
 * Represents a Lambda expression. 
 *
 * Examples:
 *  () => 45                  // no arguments, always returns 45
 *	a => a*a                 // one argument, returns the square number
 *	(a,b) => a+b             // function thats returns the sum of two arguments
 *	[1, 2, 3].map(e => 2*e)  // returns the list [2, 4, 6]
 */ 
export default class Lambda extends JelNode {
  constructor(public argNames: string[], public expression: JelNode) {
		super();
  }
  
	// override
  execute(ctx: Context): any {
    return new LambdaCallable(this.argNames, this.expression, ctx, "(anon lambda)");
	}
	
	// override
  equals(other?: JelNode): boolean {
		return other instanceof Lambda &&
			this.expression.equals(other.expression) && 
      this.argNames.length == other.argNames.length && 
      !this.argNames.find((l, i)=>l != other.argNames[i]);
	}

	toString(): string {
		if (this.argNames.length == 1) 
			return `${this.argNames[0]}=>${this.expression.toString()}`;
		else
			return `(${this.argNames.join(', ')})=>${this.expression.toString()}`;		
	}
	
  getSerializationProperties(): Object {
    return {argNames: this.argNames, expression: this.expression};
  }
}

