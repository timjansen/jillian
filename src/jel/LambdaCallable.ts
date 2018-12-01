import SerializablePrimitive from './SerializablePrimitive';
import JelNode from './expressionNodes/JelNode';
import LambdaArgument from './LambdaArgument';
import JelObject from './JelObject';
import Context from './Context';
import Callable from './Callable';
import Serializer from './Serializer';
import Util from '../util/Util';


export default class LambdaCallable extends Callable implements SerializablePrimitive {
  
  constructor(public argDefs: LambdaArgument[], public expression: JelNode, public parentContext: Context, public name?: string, public self?: JelObject) {
		super();
  }

  static checkValue(ctx: Context, argDef: LambdaArgument, value0: JelObject|null): JelObject|null {
    const value = value0 || argDef.defaultValue;
    if (argDef.type && !argDef.type.checkType(ctx, value))
      throw new Error(`Invalid argument for ${argDef.name}: expected ${argDef.type.serializeType()}, but got the value ${Serializer.serialize(value)}.`);
    return value;
  }
  
  static invoke(ctx: Context, self: JelObject|undefined, argDefs: LambdaArgument[], expression: JelNode, args: (JelObject|null)[], argObj?: Map<string,JelObject|null>): JelObject|null|Promise<JelObject|null> {
		const newCtx = new Context(ctx);
    const methodOffset = (argDefs.length && argDefs[0].name) == 'this' ? 1 : 0;
    
    args.forEach((arg, i) => {
      const argDef = argDefs[i+methodOffset];
      if (argDef)
        newCtx.set(argDef.name, LambdaCallable.checkValue(ctx, argDef, arg));
    });
    
		for (let i = args.length; i < argDefs.length-methodOffset; i++) {
      const argDef = argDefs[i+methodOffset];
      newCtx.set(argDef.name, LambdaCallable.checkValue(ctx, argDef, null));
    }
    
		if (argObj)
			for (let name of argObj.keys()) {
        let found = false;
        for (let argDef of argDefs) 
          if (name == argDef.name) {
  				  newCtx.set(name, LambdaCallable.checkValue(ctx, argDef, argObj.get(name) || null));
            found = true;
        }
        if (!found)
          throw new Error('Can not set unknown named argument ' + name);
        }
    if (methodOffset)
      newCtx.set('this', self || null);
		newCtx.freeze();
    return expression.execute(newCtx);
  }
  
	invokeWithObject(ctx: Context, self: JelObject|undefined, args: (JelObject|null)[], argObj?: Map<string,JelObject|null>): JelObject|null|Promise<JelObject|null> {   // context will be ignored for lambda. No promise support here, only in Call.
    return LambdaCallable.invoke(this.parentContext, self || this.self, this.argDefs, this.expression, args, argObj);
	}
	
	invoke(ctx: Context, self: JelObject|undefined, ...args: (JelObject|null)[]): JelObject|null|Promise<JelObject|null> {
    return LambdaCallable.invoke(this.parentContext, self || this.self, this.argDefs, this.expression, args);
	}

  rebind(self: JelObject|undefined): LambdaCallable {
    return Object.is(this.self, self) ? this : new LambdaCallable(this.argDefs, this.expression, this.parentContext, this.name, self);
  }
  
	serializeToString() : string {
		return this.toString();
	}

	toString(): string {
		if (this.argDefs.length == 1 && this.argDefs[0].isNameOnly)
			return `${this.argDefs[0].name}=>${this.expression.toString()}`;
		else
			return `(${this.argDefs.map(ad=>ad.toString()).join(', ')})=>${this.expression.toString()}`;
	}
}
