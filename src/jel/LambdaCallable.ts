import SerializablePrimitive from './SerializablePrimitive';
import JelNode from './expressionNodes/JelNode';
import TypedParameterValue from './TypedParameterValue';
import JelObject from './JelObject';
import BaseTypeRegistry from './BaseTypeRegistry';
import NamedObject from './types/NamedObject';
import ListType from './types/typeDescriptors/ListType';
import Context from './Context';
import Callable from './Callable';
import Serializer from './Serializer';
import Util from '../util/Util';
import Class from './types/Class';

export default class LambdaCallable extends Callable implements SerializablePrimitive {
  static clazz: Class|undefined;

  private varArgPos: number = Number.MAX_SAFE_INTEGER;

  
  constructor(public argDefs: TypedParameterValue[], public expression: JelNode, public parentContext: Context, public name?: string, public self?: JelObject, public superConstructor?: LambdaCallable, public returnType?: TypedParameterValue, public varArg = false) {
		super('LambdaCallable');
    
    if (this.varArg) {
      this.varArgPos = argDefs.length-1;
      const last = argDefs[this.varArgPos];
      if (last.type && !(last.type instanceof ListType))
        throw new Error(`Invalid varargs type in method/function ${this.name} argument ${last.name}. If a type is declared, it must be a ListType (e.g. "any[]")`);
      if (last.defaultValueGenerator)
        throw new Error(`Invalid varargs in method/function ${this.name} argument ${last.name}. You must not provide a default value. The default is always an empty List.`);
    }
  }
  
  get clazz(): Class {
    return LambdaCallable.clazz!;
  }
  
  private static setVariable(ctx: Context, newCtx: Context, argDef: TypedParameterValue, value0: JelObject|null|undefined): Promise<any>|undefined {
    const value = value0 != null ? value0 : (argDef.defaultValueGenerator ? argDef.defaultValueGenerator.execute(ctx) : null);
    if (argDef.type) {
      const convertedValue: any = Util.resolveValue(value, v=>argDef.type!.convert(ctx, v, argDef.name));
      if (convertedValue instanceof Promise)
        return convertedValue.then(r=>{
          if (newCtx.hasInThisScope(argDef.name))
            throw new Error(`Argument ${argDef.name} is set more than once this function call. You must not set them twice.`);
          newCtx.set(argDef.name, convertedValue);
        });
      newCtx.set(argDef.name, convertedValue);
      return;
    }
    else
      return Util.resolveValue(value, v=>{newCtx.set(argDef.name, v);});
  }
  
  private static invoke(ctx: Context, self: JelObject|undefined, superConstructor: LambdaCallable|undefined, argDefs: TypedParameterValue[], expression: JelNode, 
                         args: (JelObject|null)[], argObj: Map<string,JelObject|null>|undefined, returnType: TypedParameterValue|undefined, varArgPos: number): JelObject|null|Promise<JelObject|null> {
		const newCtx = new Context(ctx);
    const openPromises: any[] = [];
    const varArgs: (JelObject|null)[] = [];
    
    args.forEach((arg, i) => {
      if (i >= varArgPos)      
        varArgs.push(arg);
      else {
        const argDef = argDefs[i];
        if (argDef) {
          const p: Promise<any>|undefined = LambdaCallable.setVariable(ctx, newCtx, argDef, arg);
          if (p)
            openPromises.push(p);
        }
      }
    });

    let addedObjArgs = 0;
    for (let i = args.length; i < Math.min(argDefs.length, varArgPos); i++) {
      const argDef = argDefs[i];
      const v = argObj ? argObj.get(argDef.name) : undefined;
      if (v !== undefined)
        addedObjArgs++;
      if (!v && !argDef.defaultValueGenerator && !argDef.isNullable(ctx))
        throw new Error(`Argument ${argDef.name} has not been provided and has no default value.`);
      const p: Promise<any>|undefined = LambdaCallable.setVariable(ctx, newCtx, argDef, v);
      if (p)
        openPromises.push(p);
    }
    
    if (varArgPos < argDefs.length) {
      const varArgDef = argDefs[varArgPos];
      let varArgsP: any;
      if (varArgs.length) {
        if (argObj && argObj.has(varArgDef.name))
            throw new Error(`You can not both provide unnamed varargs and a named argument ${varArgDef.name} for the same List.`);
        varArgsP = varArgDef.type ? varArgDef.type.convert(ctx, BaseTypeRegistry.get('List').valueOf(varArgs), varArgDef.name) : BaseTypeRegistry.get('List').valueOf(varArgs);
      } else if (argObj && argObj.has(varArgDef.name)) {
        const varArgsO = BaseTypeRegistry.get('List').wrap(argObj.get(varArgDef.name));
        varArgsP = varArgDef.type ? varArgDef.type!.convert(ctx, varArgsO, varArgDef.name) : varArgsO;
        addedObjArgs++;
      }
      else
        varArgsP = BaseTypeRegistry.get('List').empty;
      
      if (varArgsP instanceof Promise)
       openPromises.push(Util.resolveValue(varArgsP, l=>newCtx.set(varArgDef.name, l)));
      else
       newCtx.set(varArgDef.name, varArgsP);
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
  
	invokeWithObject(self: JelObject|undefined, args: (JelObject|null)[], argObj?: Map<string,JelObject|null>): JelObject|null|Promise<JelObject|null> {   // context will be ignored for lambda. No promise support here, only in Call.
    return LambdaCallable.invoke(this.parentContext, self || this.self, this.superConstructor, this.argDefs, this.expression, args, argObj, this.returnType, this.varArgPos);
	}
	
	invoke(self: JelObject|undefined, ...args: (JelObject|null)[]): JelObject|null|Promise<JelObject|null> {
    return LambdaCallable.invoke(this.parentContext, self || this.self, this.superConstructor, this.argDefs, this.expression, args, undefined, this.returnType, this.varArgPos);
	}

  rebind(self: JelObject|undefined): LambdaCallable {
    return Object.is(this.self, self) ? this : new LambdaCallable(this.argDefs, this.expression, this.parentContext, this.name, self, this.superConstructor, this.returnType, this.varArg);
  }

  bindSuper(superConstructor: LambdaCallable|null): LambdaCallable {
    return Object.is(this.superConstructor, superConstructor) ? this : new LambdaCallable(this.argDefs, this.expression, this.parentContext, this.name, this.self, superConstructor||undefined, this.returnType, this.varArg);
  }

  bindParentContext(parentContext: Context): LambdaCallable {
    return new LambdaCallable(this.argDefs, this.expression, parentContext, this.name, this.self, this.superConstructor, this.returnType, this.varArg);
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
			return `${this.varArgPos==0 ? '...':''}${this.argDefs[0].name}=>${this.expression.toString()}`;
		else if (this.returnType && this.returnType.type)
			return `(${this.argDefs.map((ad, i)=>(i == this.varArgPos ? '...':'')+ad.toString()).join(', ')}): ${this.returnType.type.toString()}=>${this.expression.toString()}`;
    else
			return `(${this.argDefs.map((ad, i)=>(i == this.varArgPos ? '...':'')+ad.toString()).join(', ')})=>${this.expression.toString()}`;
	}
}

BaseTypeRegistry.register('LambdaCallable', LambdaCallable);
