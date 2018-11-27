import SerializablePrimitive from './SerializablePrimitive';
import JelNode from './expressionNodes/JelNode';
import JelObject from './JelObject';
import Context from './Context';
import Callable from './Callable';
import Util from '../util/Util';


export default class LambdaCallable extends Callable implements SerializablePrimitive {
  
  constructor(public argNames: string[], public expression: JelNode, public parentContext: Context, public name?: string, public self?: JelObject) {
		super();
  }

  static invoke(ctx: Context, self: JelObject|undefined, argNames: string[], expression: JelNode, args: (JelObject|null)[], argObj?: Map<string,JelObject|null>): JelObject|null|Promise<JelObject|null> {
		const newCtx = new Context(ctx);
    const methodOffset = argNames[0] == 'this' ? 1 : 0;
    args.forEach((arg, i) => newCtx.set(argNames[i+methodOffset], args[i]));
		for (let i = args.length; i < argNames.length-methodOffset; i++)
			newCtx.set(argNames[i+methodOffset], undefined);
		if (argObj)
			for (let name of argObj.keys())
				newCtx.set(name, argObj.get(name));
    if (methodOffset)
      newCtx.set('this', self || null);
		newCtx.freeze();
    return expression.execute(newCtx);
  }
  
	invokeWithObject(ctx: Context, self: JelObject|undefined, args: (JelObject|null)[], argObj?: Map<string,JelObject|null>): JelObject|null|Promise<JelObject|null> {   // context will be ignored for lambda. No promise support here, only in Call.
    return LambdaCallable.invoke(this.parentContext, self || this.self, this.argNames, this.expression, args, argObj);
	}
	
	invoke(ctx: Context, self: JelObject|undefined, ...args: (JelObject|null)[]): JelObject|null|Promise<JelObject|null> {
    return LambdaCallable.invoke(this.parentContext, self || this.self, this.argNames, this.expression, args);
	}

  rebind(self: JelObject|undefined): LambdaCallable {
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
