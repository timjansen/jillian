import JelNode from './JelNode';
import TypedParameterDefinition from './TypedParameterDefinition';
import Literal from './Literal';
import Reference from './Reference';
import As from './As';
import Optional from './Optional';
import Variable from './Variable';
import JelObject from '../JelObject';
import Runtime from '../Runtime';
import Context from '../Context';
import LambdaCallable from '../LambdaCallable';
import TypedParameterValue from '../TypedParameterValue';
import Util from '../../util/Util';


/**
 * Represents a Lambda expression. 
 *
 * Examples:
 *  () => 45                  // no arguments, always returns 45
 *	a => a*a                 // one argument, returns the square number
 *	(a,b) => a+b             // function thats returns the sum of two arguments
 *	[1, 2, 3].map(e => 2*e)  // returns the list [2, 4, 6]
 *	(a, b=5)=>a+b            // optional argument
 *	(a: Float, b: Float = 5)=>a+b          // type checks
 */ 
export default class Lambda extends JelNode {
  private wrappedExpression: JelNode;
  
  constructor(public args: TypedParameterDefinition[], public typeCheck: JelNode|undefined, public expression: JelNode) {
		super();

    this.wrappedExpression = this.typeCheck ? new As(expression, this.typeCheck, ' for return value') : expression;
  }
  
	// override
  execute(ctx: Context): JelObject|null|Promise<JelObject|null> {
    return Util.resolveArray(this.args.map(a=>a.execute(ctx)), args=>{
      return new LambdaCallable(args, this.wrappedExpression, ctx, "(anon lambda)");
    });
	}
	
	// override
  equals(other?: JelNode): boolean {
		return other instanceof Lambda &&
			this.wrappedExpression.equals(other.wrappedExpression) && 
      this.args.length == other.args.length && 
      !this.args.find((l, i)=>!l.equals(other.args[i]));
	}

	toString(): string {
    if (this.typeCheck)
			return `${this.toArgumentString()} as ${this.typeCheck.toString()}=>${this.expression.toString()}`;		
		else if (this.args.length == 1 && this.args[0].isNameOnly) 
			return `${this.args[0].name}=>${this.expression.toString()}`;
		else
			return `${this.toArgumentString()}=>${this.expression.toString()}`;		
	}

 	toArgumentString(): string {
			return `(${this.args.map(a=>a.toString()).join(', ')})`;
	}
  
  getSerializationProperties(): Object {
    return [this.args, this.typeCheck, this.expression];
  }
}

