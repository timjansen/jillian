import JelNode from './JelNode';
import JelObject from '../JelObject';
import Runtime from '../Runtime';
import Context from '../Context';
import LambdaCallable from '../LambdaCallable';
import Util from '../../util/Util';


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
  execute(ctx: Context): JelObject|null|Promise<JelObject|null> {
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

