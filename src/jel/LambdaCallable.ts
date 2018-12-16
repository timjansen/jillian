import SerializablePrimitive from './SerializablePrimitive';
import JelNode from './expressionNodes/JelNode';
import TypedParameterValue from './TypedParameterValue';
import JelObject from './JelObject';
import Context from './Context';
import Callable from './Callable';
import Serializer from './Serializer';
import Util from '../util/Util';


export default class LambdaCallable extends Callable implements SerializablePrimitive {
  
  constructor(public argDefs: TypedParameterValue[], public expression: JelNode, public parentContext: Context, public name?: string, public self?: JelObject, public superConstructor?: LambdaCallable) {
		super();
  }

  static setVariable(ctx: Context, newCtx: Context, argDef: TypedParameterValue, value0: JelObject|null): Promise<any>|undefined {
    const value = value0 || argDef.defaultValue;
    if (argDef.type) {
      const convertedValue: any = argDef.type.convert(ctx, value, argDef.name);
      if (convertedValue instanceof Promise)
        return convertedValue.then(r=>{
          if (newCtx.hasInThisScope(argDef.name))
            throw new Error(`Argument ${argDef.name} is set more than once this function call. You must not set them twice.`);
          newCtx.set(argDef.name, convertedValue);
        });
      newCtx.set(argDef.name, convertedValue);
    }
    else
      newCtx.set(argDef.name, value);
    return undefined;
  }
  
  private static invoke(ctx: Context, self: JelObject|undefined, superConstructor: LambdaCallable|undefined, argDefs: TypedParameterValue[], expression: JelNode, args: (JelObject|null)[], argObj?: Map<string,JelObject|null>): JelObject|null|Promise<JelObject|null> {
		const newCtx = new Context(ctx);
    const openPromises: any[] = [];
    
    args.forEach((arg, i) => {
      const argDef = argDefs[i];
      if (argDef) {
        const p: Promise<any>|undefined = LambdaCallable.setVariable(ctx, newCtx, argDef, arg);
        if (p)
          openPromises.push(p);
      }
    });
    
		for (let i = args.length; i < argDefs.length; i++) 
      if (!argObj || !argObj.has(argDefs[i].name)) {
        const p: Promise<any>|undefined = LambdaCallable.setVariable(ctx, newCtx, argDefs[i], null);
        if (p)
          openPromises.push(p);
      }
    
		if (argObj)
			for (let name of argObj.keys()) {
        let found = false;
        for (let argDef of argDefs) 
          if (name == argDef.name) {
            if (newCtx.hasInThisScope(name))
              throw new Error(`Argument ${name} is set more than once this function call. You must not set them twice.`);
            const p: Promise<any>|undefined = LambdaCallable.setVariable(ctx, newCtx, argDef, argObj.get(name) || null);
            if (p)
              openPromises.push(p);
            found = true;
        }
        if (!found)
          throw new Error('Can not set unknown named argument ' + name);
        }
    newCtx.set('this', self || null);
    newCtx.set('super', superConstructor || undefined);
    
    return Util.resolveArray(openPromises, ()=> {
      newCtx.freeze();
      return expression.execute(newCtx);
    });
  }
  
	invokeWithObject(ctx: Context, self: JelObject|undefined, args: (JelObject|null)[], argObj?: Map<string,JelObject|null>): JelObject|null|Promise<JelObject|null> {   // context will be ignored for lambda. No promise support here, only in Call.
    return LambdaCallable.invoke(this.parentContext, self || this.self, this.superConstructor, this.argDefs, this.expression, args, argObj);
	}
	
	invoke(ctx: Context, self: JelObject|undefined, ...args: (JelObject|null)[]): JelObject|null|Promise<JelObject|null> {
    return LambdaCallable.invoke(this.parentContext, self || this.self, this.superConstructor, this.argDefs, this.expression, args);
	}

  rebind(self: JelObject|undefined): LambdaCallable {
    return Object.is(this.self, self) ? this : new LambdaCallable(this.argDefs, this.expression, this.parentContext, this.name, self, this.superConstructor);
  }

  bindSuper(superConstructor: LambdaCallable|null): LambdaCallable {
    return Object.is(this.superConstructor, superConstructor) ? this : new LambdaCallable(this.argDefs, this.expression, this.parentContext, this.name, this.self, superConstructor||undefined);
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
