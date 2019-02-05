import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import TypedParameterDefinition from './TypedParameterDefinition';
import As from './As';
import JelObject from '../JelObject';
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
 *	(a, b=5)=>a+b            // optional argument
 *	(a: Float, b: Float = 5)=>a+b          // type checks
 */ 
export default class Lambda extends CachableJelNode {
 
  constructor(public args: TypedParameterDefinition[], public returnType: TypedParameterDefinition|undefined, public expression: JelNode, public varArg: boolean) {
		super();
  }
  
	// override
  executeUncached(ctx: Context): JelObject|null|Promise<JelObject|null> {
    if (this.returnType) {
      const eList = [this.returnType.execute(ctx)].concat(this.args.map(a=>a.execute(ctx)));
      return Util.resolveArray(eList, eListResolved=>new LambdaCallable(eListResolved.slice(1), this.expression, ctx, "(anonymous lambda)", undefined, undefined, eListResolved[0], this.varArg));
    }
    else
      return Util.resolveArray(this.args.map(a=>a.execute(ctx)), args=>new LambdaCallable(args, this.expression, ctx, "(anonymous lambda)", undefined, undefined, undefined, this.varArg));
	}
	
  isStaticUncached(ctx: Context): boolean {
    return !this.args.find(a=>!a.isStatic(ctx)) && (!this.returnType || this.returnType.isStatic(ctx));
  }
  
  flushCache(): void {
    super.flushCache();
    this.expression.flushCache();
    if (this.returnType) this.returnType.flushCache();
    this.args.forEach(a=>a.flushCache());
  }
  
	// override
  equals(other?: JelNode): boolean {
		return other instanceof Lambda &&
			this.expression.equals(other.expression) && 
      this.varArg == other.varArg &&
      ((this.returnType==other.returnType) || (!!this.returnType && !!other.returnType && this.returnType.equals(other.returnType))) &&
      this.args.length == other.args.length && 
      !this.args.find((l, i)=>!l.equals(other.args[i]));
	}

	toString(): string {
    if (this.returnType && this.returnType.type)
			return `(${this.toArgumentString()}: ${this.returnType.type.toString()}${this.toBodyString()})`;		
		else if (this.args.length == 1 && this.args[0].isNameOnly) 
			return `(${this.args[0].name}${this.toBodyString()})`;
		else
			return `(${this.toArgumentString()}${this.toBodyString()})`;		
	}
  
  toBodyString(): string {
    return `=>${this.expression.toString()}`;
  }

 	toArgumentString(): string {
			return `(${this.args.map(a=>a.toString()).join(', ')})`;
	}

 	toReturnString(): string {
			return (this.returnType && this.returnType.type) ? `:${this.returnType.type.toString()}` : '';
	}
}

