import TypeDescriptor from './TypeDescriptor';
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
import Util from '../../../util/Util';
import TypeHelper from './TypeHelper';


/**
 * Declares a property that is a Float or Fraction representing an integer.
 */
export default class NotType extends TypeDescriptor  implements SerializablePrimitive {
  static clazz: Class|undefined;
  public type: TypeDescriptor;

  constructor(public type0: JelObject|null) {
    super('NotType');
		this.type = TypeHelper.convertFromAny(type0, 'NotType() parameter');
  }
  
  get clazz(): Class {
    return NotType.clazz!;
  }
  
  // note: constants and types are not checked yet. That would become async.
  checkType(ctx: Context, value: JelObject|null): JelBoolean | Promise<JelBoolean> {
    return Util.resolveValue(this.type.checkType(ctx, value), v=>v.negate());
  }

  isNullable(ctx: Context): boolean {
    return !this.type.isNullable(ctx);
  }
  
  serializeType(): string {
    return `NotType(${this.type.serializeType()})`
  }
  
  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean|Promise<JelBoolean> {
    return other instanceof NotType ? other.type.equals(ctx, this.type) : JelBoolean.FALSE;
  }
  
  static create_jel_mapping = true;
  static create(ctx: Context, ...args: any[]) {
    return new NotType(args[0]);
  }

}

BaseTypeRegistry.register('NotType', NotType);

