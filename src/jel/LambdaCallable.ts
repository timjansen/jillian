import SerializablePrimitive from './SerializablePrimitive';
import JelNode from './expressionNodes/JelNode';
import TypedParameterValue from './TypedParameterValue';
import JelObject from './JelObject';
import NamedObject from './NamedObject';
import Context from './Context';
import Callable from './Callable';
import Serializer from './Serializer';
import Util from '../util/Util';


export default class LambdaCallable extends Callable implements SerializablePrimitive {
  
  constructor(public argDefs: TypedParameterValue[], public expression: JelNode, public parentContext: Context, public name?: string, public self?: JelObject, public superConstructor?: LambdaCallable, public returnType?: TypedParameterValue) {
		super();
  }

  private static setVariable(ctx: Context, newCtx: Context, argDef: TypedParameterValue, value0: JelObject|null|undefined): Promise<any>|undefined {
    const value = value0 || argDef.defaultValue || null;
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
  
  private static invoke(ctx: Context, self: JelObject|undefined, superConstructor: LambdaCallable|undefined, argDefs: TypedParameterValue[], expression: JelNode, args: (JelObject|null)[], argObj?: Map<string,JelObject|null>, returnType?: TypedParameterValue): JelObject|null|Promise<JelObject|null> {
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

    let addedObjArgs = 0;
    for (let i = args.length; i < argDefs.length; i++) {
      const argDef = argDefs[i];
      const v = argObj ? argObj.get(argDef.name) : undefined;
      if (v !== undefined)
        addedObjArgs++;
      if (v === undefined && argDef.defaultValue === undefined && argDef.type)
        throw new Error(`Argument ${argDef.name} has not been provided and is typed without has no default value.`);
      const p: Promise<any>|undefined = LambdaCallable.setVariable(ctx, newCtx, argDef, v||argDef.defaultValue);
      if (p)
        openPromises.push(p);
    }
    
    if (argObj && argObj.size < addedObjArgs) {
      for (let i = 0; i < Math.min(args.length, argDefs.length); i++)
        if (argObj.has(argDefs[i].name))
          throw new Error(`Argument ${argDefs[i].name} has been provided twice, once as as regular argument and once as named argument.`);
      for (let namedArg of argObj.keys()) {
        let found = false;
        for (let argDef of argDefs)
          if (argDef.name == namedArg) {
            found = true;
            break;
          }
        if (!found)
          throw new Error(`Named argument ${namedArg} not found in method definition.`);
      }
    }

    newCtx.set('this', self || null);
    newCtx.set('super', superConstructor || undefined);
    if (self instanceof NamedObject && !newCtx.has(self.distinctName))
      newCtx.set(self.distinctName, self);
    
    return Util.resolveArray(openPromises, ()=> {
      newCtx.freeze();
      const r = expression.execute(newCtx);
      if (returnType && returnType.type) 
        return Util.resolveValue(r, ret=>returnType.type!.convert(ctx, ret, 'return value'));
      else 
        return r;
    });
  }
  
	invokeWithObject(ctx: Context, self: JelObject|undefined, args: (JelObject|null)[], argObj?: Map<string,JelObject|null>): JelObject|null|Promise<JelObject|null> {   // context will be ignored for lambda. No promise support here, only in Call.
    return LambdaCallable.invoke(this.parentContext, self || this.self, this.superConstructor, this.argDefs, this.expression, args, argObj, this.returnType);
	}
	
	invoke(ctx: Context, self: JelObject|undefined, ...args: (JelObject|null)[]): JelObject|null|Promise<JelObject|null> {
    return LambdaCallable.invoke(this.parentContext, self || this.self, this.superConstructor, this.argDefs, this.expression, args, undefined, this.returnType);
	}

  rebind(self: JelObject|undefined): LambdaCallable {
    return Object.is(this.self, self) ? this : new LambdaCallable(this.argDefs, this.expression, this.parentContext, this.name, self, this.superConstructor, this.returnType);
  }

  bindSuper(superConstructor: LambdaCallable|null): LambdaCallable {
    return Object.is(this.superConstructor, superConstructor) ? this : new LambdaCallable(this.argDefs, this.expression, this.parentContext, this.name, this.self, superConstructor||undefined, this.returnType);
  }
  
  getArguments(): any[] {
    return this.argDefs;
  }
 
  getReturnType(): any {
    return this.returnType;
  }
  
	serializeToString() : string {
		return this.toString();
	}

	toString(): string {
		if (this.argDefs.length == 1 && this.argDefs[0].isNameOnly && !this.returnType)
			return `${this.argDefs[0].name}=>${this.expression.toString()}`;
		else if (this.returnType && this.returnType.type)
			return `(${this.argDefs.map(ad=>ad.toString()).join(', ')}): ${this.returnType.type.toString()}=>${this.expression.toString()}`;
    else
			return `(${this.argDefs.map(ad=>ad.toString()).join(', ')})=>${this.expression.toString()}`;
	}
}
