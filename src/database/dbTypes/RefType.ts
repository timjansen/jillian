import TypeDescriptor from '../../jel/types/typeDescriptors/TypeDescriptor';
import {IDbRef} from '../../jel/IDatabase';
import DbRef from '../DbRef';
import Dictionary from '../../jel/types/Dictionary';
import TypeChecker from '../../jel/types/TypeChecker';
import JelString from '../../jel/types/JelString';
import JelBoolean from '../../jel/types/JelBoolean';
import TypeHelper from '../../jel/types/typeDescriptors/TypeHelper';
import Context from '../../jel/Context';
import JelObject from '../../jel/JelObject';
import Serializer from '../../jel/Serializer';
import BaseTypeRegistry from '../../jel/BaseTypeRegistry';
import Category from '../dbObjects/Category';
import Class from '../../jel/types/Class';


/**
 * Declares a property that is a reference,
 */
export default class RefType extends TypeDescriptor {
  static clazz: Class|undefined;
  static instance = new RefType();

  constructor(public type?: TypeDescriptor) {
    super('RefType');
  }
  
  get clazz(): Class {
    return RefType.clazz!;
  }

  checkType(ctx: Context, value: JelObject): JelBoolean|Promise<JelBoolean> {
    if (!value || !TypeChecker.isIDbRef(value))
      return JelBoolean.FALSE;
    if (!this.type)
      return JelBoolean.TRUE;

    return (value as any).with(ctx, (v: any)=>this.type!.checkType(ctx, v));
  }
  
  getSerializationProperties(): any[] {
    return [this.type];
  }
  
  serializeType(): string {  
      return `RefType(${Serializer.serialize(this.type)})`;
  }
  
  equals(ctx: Context, other: TypeDescriptor|null): Promise<JelBoolean>|JelBoolean {
    if (!(other instanceof RefType))
      return JelBoolean.FALSE;
    if (this.type == other.type)
      return JelBoolean.TRUE;
    if (!this.type)
      return JelBoolean.FALSE;
    return this.type.equals(ctx, other);
  }

  static create_jel_mapping = true;
  static create(ctx: Context, ...args: any[]) {
    if (!args[0])
      return RefType.instance;
    return new RefType(TypeHelper.convertFromAny(args[0], 'type'));
  }
}

BaseTypeRegistry.register('RefType', RefType);


