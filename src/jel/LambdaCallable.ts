import SerializablePrimitive from './SerializablePrimitive';
import JelNode from './expressionNodes/JelNode';
import Context from './Context';
import Callable from './Callable';
import Util from '../util/Util';


export default class LambdaCallable extends Callable implements SerializablePrimitive {
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
	
	serializeToString() : string {
		return this.toString();
	}

	toString(): string {
		if (this.argNames.length == 1)
			return `${this.argNames[0]}=>${this.expression.toString()}`;
		else
			return `(${this.argNames.join(', ')})=>${this.expression.toString()}`;
	}
}
