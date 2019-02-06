import TypeDescriptor from './TypeDescriptor';
import {IDbRef} from '../../IDatabase';
import Float from '../../types/Float';
import Fraction from '../../types/Fraction';
import ApproximateNumber from '../../types/ApproximateNumber';
import UnitValue from '../../types/UnitValue';
import Range from '../../types/Range';
import Runtime from '../../Runtime';
import Context from '../../Context';
import JelObject from '../../JelObject';
import Serializer from '../../Serializer';
import SerializablePrimitive from '../../SerializablePrimitive';
import JelBoolean from '../JelBoolean';
import BaseTypeRegistry from '../../BaseTypeRegistry';
import Class from '../Class';


/**
 * Declares a property that is a Float or Fraction or ApproximateNumber or UnitValue.
 */
export default class NumericType extends TypeDescriptor implements SerializablePrimitive {
  static clazz: Class|undefined;
  static readonly instance = new NumericType();

  constructor(public range?: Range) {
    super('NumericType');
  }
  
  get clazz(): Class {
    return NumericType.clazz!;
  }
  
  checkType(ctx: Context, value: JelObject|null): JelBoolean|Promise<JelBoolean> {
    if (!(value instanceof Float || value instanceof Fraction || value instanceof UnitValue || value instanceof ApproximateNumber))
      return JelBoolean.FALSE;
    if (!this.range)
      return JelBoolean.TRUE;
    return this.range.contains(ctx, value);
  }
  
  serializeType(): string {
    if (this.range)
      return `numeric(${Serializer.serialize(this.range)})`
    else
      return 'numeric';
  }
  
  serializeToString() : string {
		return this.serializeType();
	}
  
  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean|Promise<JelBoolean> {
    return other instanceof NumericType ? (this.range == null ? JelBoolean.valueOf(other.range == null) : (other.range == null ? JelBoolean.FALSE : Runtime.op(ctx, '===', this.range, other.range) as any)) : JelBoolean.FALSE;
  }

  create_jel_mapping: any;
  create(ctx: Context, rangeOrMin: any, max: any): NumericType {
    if (rangeOrMin instanceof Range)
      return rangeOrMin.isFinite() ? new NumericType(rangeOrMin) : NumericType.instance;
    else if (rangeOrMin!=null && !NumericType.instance.checkType(ctx, rangeOrMin))
      throw new Error('Min of NumericType must be numeric.');
    else if (max!=null && !NumericType.instance.checkType(ctx, max))
      throw new Error('Max of NumericType must be numeric.');
    return (rangeOrMin==null && max == null) ? NumericType.instance : new NumericType(new Range(rangeOrMin, max));
  }

  static create_jel_mapping = true;
  static create(ctx: Context, ...args: any[]): NumericType {
    return NumericType.instance.create(ctx, args[0], args[1]);
  }

  
}

NumericType.prototype.create_jel_mapping = true;
BaseTypeRegistry.register('NumericType', NumericType);





