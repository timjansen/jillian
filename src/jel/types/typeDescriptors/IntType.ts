import TypeDescriptor from './TypeDescriptor';
import {IDbRef} from '../../IDatabase';
import Float from '../../types/Float';
import Fraction from '../../types/Fraction';
import Range from '../../types/Range';
import Runtime from '../../Runtime';
import Context from '../../Context';
import JelObject from '../../JelObject';
import SerializablePrimitive from '../../SerializablePrimitive';
import Serializer from '../../Serializer';
import JelBoolean from '../JelBoolean';
import TypeChecker from '../TypeChecker';
import BaseTypeRegistry from '../../BaseTypeRegistry';


/**
 * Declares a property that is a Float or Fraction representing an integer.
 */
export default class IntType extends TypeDescriptor {
  static readonly instance = new IntType();

  constructor(public range?: Range) {
    super();
  }
  
  // note: constants and types are not checked yet. That would become async.
  checkType(ctx: Context, value: JelObject|null): JelBoolean | Promise<JelBoolean> {
    if (!(value instanceof Float || value instanceof Fraction) || !Number.isInteger((value as any).toFloat().value))
      return JelBoolean.FALSE;
    if (!this.range)
      return JelBoolean.TRUE;
    return this.range.contains(ctx, value);
  }
  
  serializeType(): string {
    if (this.range)
      return `int(${Serializer.serialize(this.range)})`
    else
      return 'int';
  }
  
  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean|Promise<JelBoolean> {
    return other instanceof IntType ? (this.range == null ? JelBoolean.valueOf(other.range == null) : (other.range == null ? JelBoolean.FALSE : Runtime.op(ctx, '===', this.range, other.range) as any)) : JelBoolean.FALSE;
  }
  
  create_jel_mapping: any;
  create(ctx: Context, rangeOrMin: any, max: any): IntType {
    if (rangeOrMin instanceof Range)
      return rangeOrMin.isFinite() ? new IntType(rangeOrMin) : IntType.instance;
    else if (rangeOrMin!=null && !IntType.instance.checkType(ctx, rangeOrMin))
      throw new Error('Min of IntType must be int.');
    else if (max!=null && !IntType.instance.checkType(ctx, max))
      throw new Error('Max of IntType must be int.');
    return (rangeOrMin==null && max == null) ? IntType.instance : new IntType(new Range(rangeOrMin, max));
  }
  
  serializeToString() : string {
		return this.serializeType();
	}
}

IntType.prototype.create_jel_mapping = {range: 1, min: 1, max: 2};



