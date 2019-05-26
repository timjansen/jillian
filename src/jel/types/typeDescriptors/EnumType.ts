import TypeDescriptor from './TypeDescriptor';
import TypeChecker from '../TypeChecker';
import {IDbRef} from '../../IDatabase';
import JelBoolean from '../../types/JelBoolean';
import Enum from '../../types/Enum';
import EnumValue from '../../types/EnumValue';
import Runtime from '../../Runtime';
import Context from '../../Context';
import JelObject from '../../JelObject';
import Serializer from '../../Serializer';
import SerializablePrimitive from '../../SerializablePrimitive';
import BaseTypeRegistry from '../../BaseTypeRegistry';
import Class from '../Class';


/**
 * Declares a property that is a Enum.
 */
export default class EnumType extends TypeDescriptor  implements SerializablePrimitive {
  static clazz: Class|undefined;
  static empty = new EnumType();
  
  constructor(public enumName?: string) {
    super('Enum');
  }
  
  get clazz(): Class {
    return EnumType.clazz!;
  }
  
  // note: constants and types are not checked yet. That would become async.
  checkType(ctx: Context, value: JelObject|null): JelBoolean {
    if (value instanceof EnumValue)
      return JelBoolean.valueOf(!this.enumName || (value.parent.distinctName == this.enumName));
    return JelBoolean.FALSE;
  }
  
  serializeType(): string {
    return this.enumName ? `EnumType(${this.enumName})` : 'EnumType()';
  }
  
  serializeToString() : string {
		return this.serializeType();
	}
  
  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean {
    return JelBoolean.valueOf(other instanceof EnumType && this.enumName == other.enumName);
  }
  
  static create_jel_mapping = true;
  static create(ctx: Context, ...args: any[]) {
    if (!args[0])
      return EnumType.empty;
    return new EnumType(args[0] instanceof Enum ? args[0].distinctName : TypeChecker.realString(args[0], 'enumRef'));
  }
}

BaseTypeRegistry.register('EnumType', EnumType);
