import TypeDescriptor from './TypeDescriptor';
import {IDbRef} from '../../IDatabase';
import Fraction from '../../types/Fraction';
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
 * Declares a property that is a within the given range. The type doesn't matter, as long as it is in that range.
 */
export default class InRangeType extends TypeDescriptor  implements SerializablePrimitive {
  static clazz: Class|undefined;

  constructor(public range: Range) {
    super('InRange');
  }
  
  get clazz(): Class {
    return InRangeType.clazz!;
  }
  
  checkType(ctx: Context, value: JelObject|null): JelBoolean|Promise<JelBoolean> {
    return this.range.contains(ctx, value);
  }
  
  serializeType(): string {
    return `InRangeType(${Serializer.serialize(this.range)})`
  }
  
  serializeToString() : string {
		return this.serializeType();
	}

  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean|Promise<JelBoolean> {
    return other instanceof InRangeType ? Runtime.op(ctx, '===', this.range, other.range) as any : JelBoolean.FALSE;
  }
  
  static create_jel_mapping = ['range'];
  static create(ctx: Context, clazz: any, ...args: any[]): InRangeType {
    if (!(args[0] instanceof Range))
      throw new Error('InRangeType requires a Range as first argument.');
    return new InRangeType(args[0]);
  }

}

BaseTypeRegistry.register('InRangeType', InRangeType);
