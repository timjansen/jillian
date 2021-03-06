import TypeDescriptor from './TypeDescriptor';
import TypeHelper from './TypeHelper';
import {IDbRef} from '../../IDatabase';
import Dictionary from '../../types/Dictionary';
import List from '../../types/List';
import TypeChecker from '../../types/TypeChecker';
import BaseTypeRegistry from '../../BaseTypeRegistry';
import Context from '../../Context';
import JelObject from '../../JelObject';
import JelBoolean from '../JelBoolean';
import Class from '../Class';
import SerializablePrimitive from '../../SerializablePrimitive';


/**
 * Represets a type that can be null. Is a shortcut for OptionType with null
 */
export default class OptionalType extends TypeDescriptor {
  static clazz: Class|undefined;
	type: TypeDescriptor;
	
  constructor(e: JelObject|null) {
    super('OptionalType');
		this.type = TypeHelper.convertFromAny(e, 'property types');
  }
  
  get clazz(): Class {
    return OptionalType.clazz!;
  }
  
  getSerializationProperties(): any[] {
    return [this.type];
  }
	
  checkType(ctx: Context, value: JelObject|null): JelBoolean|Promise<JelBoolean> {
    if (value == null)
      return JelBoolean.TRUE;
    return this.type.checkType(ctx, value);
  }

  convert(ctx: Context, value: JelObject|null, fieldName=''): JelObject|null|Promise<JelObject|null> {
    if (value == null)
      return value;
    return this.type.convert(ctx, value, fieldName);
  }
  
  static valueOf(e: JelObject): OptionalType {
    return new OptionalType(e);
  }
  
  serializeType(): string {
    return `${this.type}?`;
  }
  
  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean|Promise<JelBoolean> {
    return other instanceof OptionalType ? TypeDescriptor.equals(ctx, this.type, other.type) : JelBoolean.FALSE;
  }
  
  isNullable(ctx: Context): boolean {
    return true;
  }
  
  static create_jel_mapping = true;
  static create(ctx: Context, ...args: any[]) {
    return new OptionalType(args[0]);
  }
}

BaseTypeRegistry.register('OptionalType', OptionalType);



