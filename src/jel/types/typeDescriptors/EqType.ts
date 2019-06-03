import TypeDescriptor from './TypeDescriptor';
import {IDbRef} from '../../IDatabase';
import Float from '../Float';
import Fraction from '../Fraction';
import Range from '../Range';
import Runtime from '../../Runtime';
import Context from '../../Context';
import JelObject from '../../JelObject';
import SerializablePrimitive from '../../SerializablePrimitive';
import Serializer from '../../Serializer';
import JelBoolean from '../JelBoolean';
import TypeChecker from '../TypeChecker';
import BaseTypeRegistry from '../../BaseTypeRegistry';
import Class from '../Class';


/**
 * A type that's only equal if the other value is identical
 */
export default class EqType extends TypeDescriptor  implements SerializablePrimitive {
  static clazz: Class|undefined;

  static readonly instance = new EqType(null, false, false);

  constructor(public eq: JelObject|null, public sameType: boolean = false, public strict: boolean = false) {
    super('EqType');
  }
  
  get clazz(): Class {
    return EqType.clazz!;
  }
  
  // note: constants and types are not checked yet. That would become async.
  checkType(ctx: Context, value: JelObject|null): JelBoolean | Promise<JelBoolean> {
    if (value == null || this.eq == null)
      return JelBoolean.valueOf(this.eq == value);

    if (this.sameType && value.className != this.eq.className)
      return JelBoolean.FALSE;

    return Runtime.op(ctx, this.strict ? '===' : '==', this.eq, value) as any;
  }

  isNullable(ctx: Context): boolean {
    return this.eq == null;
  }
  
  serializeType(): string {
    if (this.sameType || this.strict)
      return `eq(${Serializer.serialize(this.eq)}, ${this.sameType?'true':'false'}, ${this.strict?'true':'false'})`;
    else
      return `eq(${Serializer.serialize(this.eq)})`;
  }
  
  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean|Promise<JelBoolean> {
    return other instanceof EqType ? 
      this.strict == other.strict && this.sameType == other.sameType && (this.eq == null ? JelBoolean.valueOf(other.eq == null) : (other.eq == null ? JelBoolean.FALSE : Runtime.op(ctx, '===', this.eq, other.eq) as any)) 
      : JelBoolean.FALSE;
  }
  
  create_jel_mapping: any;
  create(ctx: Context, eq: JelObject|null, sameType: any, strict: any): EqType {
    return new EqType(eq, TypeChecker.realBoolean(sameType, 'sameType', false), TypeChecker.realBoolean(strict, 'strict', false));
  }
  
  static create_jel_mapping = true;
  static create(ctx: Context, ...args: any[]) {
    return new EqType(args[0], TypeChecker.realBoolean(args[1], 'sameType', false), TypeChecker.realBoolean(args[2], 'strict', false));
  }

}

EqType.prototype.create_jel_mapping = true;

BaseTypeRegistry.register('EqType', EqType);

