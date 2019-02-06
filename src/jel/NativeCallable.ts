import SerializablePrimitive from './SerializablePrimitive';
import JelNode from './expressionNodes/JelNode';
import TypedParameterValue from './TypedParameterValue';
import JelObject from './JelObject';
import ListType from './types/typeDescriptors/ListType';
import NamedObject from './types/NamedObject';
import Context from './Context';
import Callable from './Callable';
import Serializer from './Serializer';
import Util from '../util/Util';
import BaseTypeRegistry from './BaseTypeRegistry';


export default class NativeCallable extends Callable implements SerializablePrimitive {
  private varArgPos = Number.MAX_SAFE_INTEGER;
  
  constructor(public self: JelObject|undefined, public argDefs: TypedParameterValue[], public returnType: TypedParameterValue|undefined, public nativeFunction: Function, public parentContext: Context, public name: string, public varArg = false) {
		super('NativeCallable');
    
    if (this.varArg) {
      this.varArgPos = argDefs.length-1;
      const last = argDefs[this.varArgPos];
      if (last.type && !(last.type instanceof ListType))
        throw new Error(`Invalid varargs type in method/function ${this.name}() argument ${last.name}. If a type is declared, it must be a ListType (e.g. "any[]")`);
      if (last.defaultValueGenerator)
        throw new Error(`Invalid varargs in method/function ${this.name}() argument ${last.name}. You must not provide a default value. The default is always an empty List.`);
    }
  }

  
  private static invoke(ctx: Context, name: string, self: JelObject|undefined, argDefs: TypedParameterValue[], returnType: TypedParameterValue|undefined, nativeFunction: Function, 
                         args: (JelObject|null)[], argObj: Map<string,JelObject|null>|undefined, varArgPos: number): JelObject|null|Promise<JelObject|null> {

    const varArg = varArgPos<argDefs.length;
    if (args.length > argDefs.length && !varArg) 
      throw new Error(`Expected up to ${argDefs.length} arguments, but got ${args.length} for native function ${name}() in ${self?self.className:'(unknown)'}: ${args.map(s=>s==null?'null':Serializer.serialize(s)).join(', ')}`);

    let allArgs: (JelObject|null)[];
    
    const lastRegularArg = Math.min(argDefs.length, varArgPos);
    
		if (argObj && args.length < lastRegularArg) {
      allArgs = args.slice(0)
      let argsFound = 0;
      for (let i = args.length; i < lastRegularArg; i++) { 
        const v = argDefs[i].name;
        argsFound++;
        allArgs[i] = argObj.get(v)||null;
      }
      if (argsFound < argObj.size || argObj.size > lastRegularArg-args.length)
        for (let key of argObj.keys()) {
          const idx = argDefs.findIndex(argDef=>key==argDef.name);
          if (idx < 0)
            throw new Error(`Can not set unknown named argument ${key} in method ${name}()`);
          else if (idx < args.length)
            throw new Error(`Argument ${key} at index ${idx+1} has been specified twice`);
        }
    }
    else
      allArgs = args.slice(0, lastRegularArg);

    if (varArg) {
      const varArgs = args.slice(lastRegularArg);
      const namedVarArg = argObj && argObj.get(argDefs[lastRegularArg].name);

      if (namedVarArg && varArgs.length)
        throw new Error(`Can not provide varargs both as named object and using unnamed arguments in method ${name}()`);
      if (namedVarArg)
        allArgs.push(BaseTypeRegistry.get('List').wrap(namedVarArg));
      else
        allArgs.push(BaseTypeRegistry.get('List').valueOf(varArgs));
    }
  
    const funcArgs: any[] = [ctx];
    for (let i = 0; i < argDefs.length; i++) {
      const argDef = argDefs[i];
      if (i >= allArgs.length && argDef.defaultValueGenerator === undefined && !argDef.isNullable(ctx))
        throw new Error(`Argument ${argDef.name} is missing in invocation of ${name}(). It is required, as no default value has been provided. Provided arguments: ${args.map(s=>s==null?'null':s.toString()).join(', ')}`);
      const v = allArgs[i] != null ? allArgs[i] : (argDef.defaultValueGenerator ? argDef.defaultValueGenerator.execute(ctx) : null);

      if (argDef.type)
        funcArgs.push(Util.resolveValue(v, v0=>argDef.type!.convert(ctx, v0, argDef.name)));
      else
        funcArgs.push(v);
    }

    return Util.resolveArray(funcArgs, (resolvedArgs: (JelObject|null)[]) => {
      const r = nativeFunction.apply(self, resolvedArgs);
      if (returnType && returnType.type) 
        return Util.resolveValue(r, ret=>returnType.type!.convert(ctx, BaseTypeRegistry.mapNativeTypes(ret), 'return value'));
      else 
        return Util.resolveValue(r, BaseTypeRegistry.mapNativeTypes);
    });
  }
  
	invokeWithObject(ctx: Context, self: JelObject|undefined, args: (JelObject|null)[], argObj?: Map<string,JelObject|null>): JelObject|null|Promise<JelObject|null> {   // context will be ignored for lambda. No promise support here, only in Call.
    return NativeCallable.invoke(this.parentContext||ctx, this.name, self || this.self, this.argDefs, this.returnType, this.nativeFunction, args, argObj, this.varArgPos);
	}
	
	invoke(ctx: Context, self: JelObject|undefined, ...args: (JelObject|null)[]): JelObject|null|Promise<JelObject|null> {
    return NativeCallable.invoke(this.parentContext||ctx, this.name, self || this.self, this.argDefs, this.returnType, this.nativeFunction, args, undefined, this.varArgPos);
	}

  rebind(self: JelObject|undefined): NativeCallable {
    return Object.is(this.self, self) ? this : new NativeCallable(self, this.argDefs, this.returnType, this.nativeFunction, this.parentContext, this.name, this.varArg);
  }
  
  bindParentContext(parentContext: Context): NativeCallable {
    return new NativeCallable(this.self, this.argDefs, this.returnType, this.nativeFunction, parentContext, this.name, this.varArg);
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
			return `${this.varArgPos==0 ? '...':''}${this.argDefs[0].name}=> (native impl)`;
		else if (this.returnType && this.returnType.type)
			return `(${this.argDefs.map((ad, i)=>(i == this.varArgPos ? '...':'')+ad.toString()).join(', ')}): ${this.returnType.type.toString()}=> (native impl)`;
    else
			return `(${this.argDefs.map((ad, i)=>(i == this.varArgPos ? '...':'')+ad.toString()).join(', ')})=> (native impl)`;
	}
}
