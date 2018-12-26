import TypeDescriptor from './TypeDescriptor';
import {IDbRef} from '../../IDatabase';
import Float from '../../types/Float';
import Fraction from '../../types/Fraction';
import Range from '../../types/Range';
import Runtime from '../../Runtime';
import Context from '../../Context';
import JelObject from '../../JelObject';
import Serializer from '../../Serializer';
import SerializablePrimitive from '../../SerializablePrimitive';
import JelBoolean from '../JelBoolean';


/**
 * Declares a property that is a Float or Fraction representing a number.
 */
export default class NumberType extends TypeDescriptor {
  static readonly instance = new NumberType();

  constructor(public range?: Range) {
    super();
  }
  
  // note: constants and types are not checked yet. That would become async.
  checkType(ctx: Context, value: JelObject|null): JelBoolean|Promise<JelBoolean> {
    if (!(value instanceof Float || value instanceof Fraction))
      return JelBoolean.FALSE;
    if (!this.range)
      return JelBoolean.TRUE;
    return this.range.contains(ctx, value);
  }
  
  serializeType(): string {
    if (this.range)
      return `number(${Serializer.serialize(this.range)})`
    else
      return 'number';
  }
  
  serializeToString() : string {
		return this.serializeType();
	}

  create_jel_mapping: any;
  create(ctx: Context, rangeOrMin: any, max: any): NumberType {
    if (rangeOrMin instanceof Range)
      return rangeOrMin.isFinite() ? new NumberType(rangeOrMin) : NumberType.instance;
    else if (rangeOrMin!=null && !NumberType.instance.checkType(ctx, rangeOrMin))
      throw new Error('Min of NumberType must be number.');
    else if (max!=null && !NumberType.instance.checkType(ctx, max))
      throw new Error('Max of NumberType must be number.');
    return (rangeOrMin==null && max == null) ? NumberType.instance : new NumberType(new Range(rangeOrMin, max));
  }

}

NumberType.prototype.create_jel_mapping = {range: 1, min: 1, max: 2};




