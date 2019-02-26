import TypeDescriptor from './TypeDescriptor';
import List from '../List';
import TypeChecker from '../TypeChecker';
import Callable from '../../Callable';
import Context from '../../Context';
import JelObject from '../../JelObject';
import TypedParameterValue from '../../TypedParameterValue';
import Serializer from '../../Serializer';
import JelBoolean from '../JelBoolean';
import Util from '../../../util/Util';
import BaseTypeRegistry from '../../BaseTypeRegistry';
import Class from '../Class';

/**
 * Declares a property type that is either a JEL function or a method.
 */
export default class FunctionType extends TypeDescriptor {
  static clazz: Class|undefined;
  static readonly instance = new FunctionType();

	/**
	 * A prototype callable to take the arguments from.
	 */
  constructor(public prototype?: Callable, public requireExactTypes = false) {
    super('FunctionType');
  }
  
  get clazz(): Class {
    return FunctionType.clazz!;
  }

  checkType(ctx: Context, value: JelObject|null): JelBoolean|Promise<JelBoolean> {
    if (!(value instanceof Callable))
      return JelBoolean.FALSE;
    if (!this.prototype)
      return JelBoolean.TRUE;
    
    return Util.resolveValue(TypedParameterValue.compatibleTypes(ctx, this.prototype.getReturnType(), value.getReturnType(), !this.requireExactTypes), (retCheck: JelBoolean)=>{
      if (!retCheck.toRealBoolean())
        return JelBoolean.FALSE;

      const protoArgs = this.prototype!.getArguments();
      const valueArgs = value.getArguments();
      if (!protoArgs || !valueArgs)
        return JelBoolean.TRUE;

      if (protoArgs.length < valueArgs.length)
        return JelBoolean.FALSE;
      
      return Util.resolveArray(protoArgs.map((arg,i)=>i < valueArgs.length ? TypedParameterValue.compatibleTypes(ctx, arg, valueArgs[i], !this.requireExactTypes) : JelBoolean.TRUE), 
                    (argResults: JelBoolean[])=>JelBoolean.valueOf(argResults.findIndex(e=>!e.toRealBoolean()) < 0));
    });
  }
  
  getSerializationProperties(): any[] {
    return [this.prototype, this.requireExactTypes];
  }

  serializeType(): string {
    return this.requireExactTypes ? `FunctionType(${Serializer.serialize(this.prototype)}, ${this.requireExactTypes})` : `FunctionType(${Serializer.serialize(this.prototype)})`;
  }
  
  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean|Promise<JelBoolean> {
    if (!(other instanceof FunctionType && this.requireExactTypes == other.requireExactTypes))
      return JelBoolean.FALSE;
    if (this.prototype == other.prototype)
      return JelBoolean.TRUE;
    if (!this.prototype || !other.prototype)
      return JelBoolean.FALSE;

    return Util.resolveValue(TypedParameterValue.compatibleTypes(ctx, this.prototype.getReturnType(), other.prototype.getReturnType(), false), isReturnCompatible=>{
      if (!isReturnCompatible.toRealBoolean())
        return isReturnCompatible;

      const protoArgs = this.prototype!.getArguments();
      const otherArgs = other.prototype!.getArguments();
      if (!protoArgs || !otherArgs)
        return JelBoolean.valueOf(protoArgs == otherArgs);
      if (protoArgs.length != otherArgs.length)
        return JelBoolean.FALSE;
      if (protoArgs.findIndex((a, i)=>a.name != otherArgs[i].name) >=0)
        return JelBoolean.FALSE;
      return Util.resolveArray(protoArgs.map((arg,i)=>TypedParameterValue.compatibleTypes(ctx, arg, otherArgs[i], false)), 
                    (argResults: JelBoolean[])=>JelBoolean.valueOf(argResults.findIndex(e=>!e.toRealBoolean()) < 0));
    });   
  }

  create_jel_mapping: boolean; 
  create(ctx: Context, ...args: any[])  {
    return FunctionType.create(ctx, ...args);
  }
  
  static create_jel_mapping = true;
  static create(ctx: Context, ...args: any[]) {
    return new FunctionType(TypeChecker.optionalInstance(Callable, args[0], 'prototype') || undefined, TypeChecker.realBoolean(args[1], 'requireExactTypes', false));
  }
}

FunctionType.prototype.create_jel_mapping = FunctionType.create_jel_mapping;
BaseTypeRegistry.register('FunctionType', FunctionType);


