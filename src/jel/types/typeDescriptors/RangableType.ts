import TypeDescriptor from './TypeDescriptor';
import TypeHelper from './TypeHelper';
import Range from '../Range';
import TypeChecker from '../TypeChecker';
import Dictionary from '../../types/Dictionary';
import Context from '../../Context';
import JelObject from '../../JelObject';
import JelBoolean from '../JelBoolean';
import Util from '../../../util/Util';
import BaseTypeRegistry from '../../BaseTypeRegistry';
import Class from '../Class';
import SerializablePrimitive from '../../SerializablePrimitive';



/**
 * Declares a type that either represents a Range of the given types, or just one of the types.
 */
export default class RangableType extends TypeDescriptor {
  static clazz: Class|undefined;
	public types: TypeDescriptor;
	
	/**
	 * types - one or more Types to define the acceptable members types of the range. 
	 */
  constructor(types: JelObject|null) {
    super('RangableType');
		this.types = TypeHelper.convertFromAny(types, 'range values');
  }
  
  get clazz(): Class {
    return RangableType.clazz!;
  }
  
  checkType(ctx: Context, value: JelObject|null): JelBoolean|Promise<JelBoolean> {
    if (value instanceof Range)
      return Util.resolveValue(this.types.checkType(ctx, value.min), (r: any)=>r.toRealBoolean() ? this.types.checkType(ctx, value.max) : r);
    else 
      return this.types.checkType(ctx, value);
  }
  
  convert(ctx: Context, value: JelObject|null, fieldName=''): JelObject|null|Promise<JelObject|null> {
    if (value instanceof Range)
      return Util.resolveValue(this.checkType(ctx, value), (b: JelBoolean)=>b.toRealBoolean() ? value : Util.resolveValues((min: any, max: any)=>new Range(min, max), this.types.convert(ctx, value.min, fieldName), this.types.convert(ctx, value.max, fieldName)));
    
    return Util.resolveValue(this.types.convert(ctx, value, fieldName), v=>new Range(v, v));
  }

  
  getSerializationProperties(): any[] {
    return [this.types];
  }
  
  serializeType(): string {
    return `RangableType(${this.types.serializeType()})`;
  }   
  
  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean|Promise<JelBoolean> {
    return other instanceof RangableType ? TypeDescriptor.equals(ctx, this.types, other.types) : JelBoolean.FALSE;
  }
 
  static valueOf(e: JelObject): RangableType {
    return new RangableType(e);
  }

  static create_jel_mapping = ['types'];
  static create(ctx: Context, ...args: any[]) {
    return new RangableType(args[0]);
  }
}
  
BaseTypeRegistry.register('RangableType', RangableType);





