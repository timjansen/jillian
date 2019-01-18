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



/**
 * Declares a property type that is a range.
 */
export default class RangeType extends TypeDescriptor {
	public types: TypeDescriptor;
	
	/**
	 * types - one or more Types to define the acceptable members types of the range. 
	 */
  constructor(types: JelObject|null) {
    super();
		this.types = TypeHelper.convertFromAny(types, 'range values');
  }
  
  checkType(ctx: Context, value: JelObject|null): JelBoolean|Promise<JelBoolean> {
    if (!(value instanceof Range))
      return JelBoolean.FALSE;
     
    return Util.resolveValue(this.types.checkType(ctx, value.min), (r: any)=>r.toRealBoolean() ? this.types.checkType(ctx, value.max) : r);
  }
  
  getSerializationProperties(): Object {
    return [this.types];
  }
  
  serializeType(): string {
    return this.types ? `RangeType(${this.types.serializeType()})` : `RangeType()`;
  }
  
  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean|Promise<JelBoolean> {
    return other instanceof RangeType ? TypeDescriptor.equals(ctx, this.types, other.types) : JelBoolean.FALSE;
  }

  static create_jel_mapping = ['types'];
  static create(ctx: Context, ...args: any[]) {
    return new RangeType(args[0]);
  }
}




