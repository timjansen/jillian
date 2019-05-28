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
  
  constructor(public enumClass?: Enum) {
    super('EnumType');
  }
  
  get clazz(): Class {
    return EnumType.clazz!;
  }
  
  // note: constants and types are not checked yet. That would become async.
  checkType(ctx: Context, value: JelObject|null): JelBoolean {
    if ((value instanceof EnumValue) && this.enumClass) {
      if (value.parent === Enum.anonymous) 
        return JelBoolean.valueOf(this.enumClass.valueMap.elements.has(value.value));
      else
        return JelBoolean.valueOf(value.parent.distinctName == this.enumClass.name);
    }
    return JelBoolean.FALSE;
  }
  
  convert(ctx: Context, value: JelObject|null, fieldName=''): JelObject|null|Promise<JelObject|null> {
    if (value instanceof EnumValue && value.parent === Enum.anonymous && this.enumClass) {
      const e = this.enumClass.valueMap.elements.get(value.value);
      if (e)
        return e;
      else
        return Promise.reject(new Error(`Failed to convert${fieldName?" value for '"+fieldName+"'":''} to ${this.serializeType()}. Anonymous enum #${value.value} can not be converted to enum ${this.enumClass.name}. Unsupported value.`));
    }
    else
      return super.convert(ctx, value, fieldName);
  }

  serializeType(): string {
    return this.enumClass ? `EnumType(${this.enumClass.name})` : 'EnumType()';
  }
  
  serializeToString() : string {
		return this.serializeType();
	}
  
  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean {
    return JelBoolean.valueOf(other instanceof EnumType && ((this.enumClass==other.enumClass) || (!!this.enumClass && !!other.enumClass && this.enumClass!.name == other.enumClass!.name)));
  }
  
  static create_jel_mapping = true;
  static create(ctx: Context, ...args: any[]) {
    if (!args[0])
      return EnumType.empty;
    return new EnumType(TypeChecker.instance(Enum, args[0], 'enum'));
  }
}

BaseTypeRegistry.register('EnumType', EnumType);
