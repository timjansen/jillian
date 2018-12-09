import JelNode from './JelNode';
import Argument from './Argument';
import Literal from './Literal';
import Reference from './Reference';
import Optional from './Optional';
import Variable from './Variable';
import JelObject from '../JelObject';
import Runtime from '../Runtime';
import Context from '../Context';
import LambdaCallable from '../LambdaCallable';
import LambdaArgument from '../LambdaArgument';
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
 *	(a: Number, b: Number = 5)=>a+b          // type checks
 */ 
export default class Lambda extends JelNode {
  public argsAreCachable: boolean;
  public cachedArguments: LambdaArgument[]|undefined;
  
  constructor(public args: Argument[], public expression: JelNode) {
		super();
    this.argsAreCachable = !!args.find(arg=>(!arg.defaultValue ||
                                            arg.defaultValue instanceof Literal ||
                                            arg.defaultValue instanceof Reference) && 
                                       (!arg.type || 
                                        arg.type instanceof Reference || 
                                        (arg.type instanceof Optional && arg.type.left instanceof Reference) ||
                                        (arg.type instanceof Variable && arg.type.name == 'any')));
  }
  
	// override
  execute(ctx: Context): JelObject|null|Promise<JelObject|null> {
    if (this.cachedArguments)
      return new LambdaCallable(this.cachedArguments, this.expression, ctx, "(anon lambda)");

    return Util.resolveArray(this.args.map(a=>a.execute(ctx)), args=>{
      if (this.argsAreCachable)
        this.cachedArguments = args;
      return new LambdaCallable(args, this.expression, ctx, "(anon lambda)");
    });
	}
	
	// override
  equals(other?: JelNode): boolean {
		return other instanceof Lambda &&
			this.expression.equals(other.expression) && 
      this.args.length == other.args.length && 
      !this.args.find((l, i)=>!l.equals(other.args[i]));
	}

	toString(): string {
		if (this.args.length == 1 && this.args[0].isNameOnly) 
			return `${this.args[0].name}=>${this.expression.toString()}`;
		else
			return `${this.toArgumentString()}=>${this.expression.toString()}`;		
	}

 	toArgumentString(): string {
			return `(${this.args.map(a=>a.toString()).join(', ')})`;		
	}

  
  getSerializationProperties(): Object {
    return [this.args, this.expression];
  }
}

