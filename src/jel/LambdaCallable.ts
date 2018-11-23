import SerializablePrimitive from './SerializablePrimitive';
import JelNode from './expressionNodes/JelNode';
import JelObject from './JelObject';
import Context from './Context';
import Callable from './Callable';
import Util from '../util/Util';


export default class LambdaCallable extends Callable implements SerializablePrimitive {
  
  constructor(public argNames: string[], public expression: JelNode, public parentContext: Context, public name?: string, public self?: any) {
		super();
  }

  static invoke(ctx: Context, self: any, argNames: string[], expression: JelNode, args: any[], argObj?: any): JelObject|null|Promise<JelObject|null> {
		const newCtx = new Context(ctx);
    const methodOffset = argNames[0] == 'this' ? 1 : 0;
    args.forEach((arg, i) => newCtx.set(argNames[i+methodOffset], args[i]));
		for (let i = args.length; i < argNames.length-methodOffset; i++)
			newCtx.set(argNames[i+methodOffset], undefined);
		if (argObj)
			for (let name in argObj)
				newCtx.set(name, argObj[name]);
    if (methodOffset)
      newCtx.set('this', self || null);
		newCtx.freeze();
    return expression.execute(newCtx);
  }
  
	invokeWithObject(ctx: Context, self: any, args: any[], argObj?: any): any {   // context will be ignored for lambda. No promise support here, only in Call.
    return LambdaCallable.invoke(this.parentContext, self || this.self, this.argNames, this.expression, args, argObj);
	}
	
	invoke(ctx: Context, self: any, ...args: any[]): any {
    return LambdaCallable.invoke(this.parentContext, self || this.self, this.argNames, this.expression, args);
	}

  rebind(self: any): LambdaCallable {
    return Object.is(this.self, self) ? this : new LambdaCallable(this.argNames, this.expression, this.parentContext, this.name, self);
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
