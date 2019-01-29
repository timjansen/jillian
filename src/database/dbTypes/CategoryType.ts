import TypeDescriptor from '../../jel/types/typeDescriptors/TypeDescriptor';
import {IDbRef} from '../../jel/IDatabase';
import DbRef from '../DbRef';
import Dictionary from '../../jel/types/Dictionary';
import TypeChecker from '../../jel/types/TypeChecker';
import JelString from '../../jel/types/JelString';
import JelBoolean from '../../jel/types/JelBoolean';
import Context from '../../jel/Context';
import JelObject from '../../jel/JelObject';
import Serializer from '../../jel/Serializer';
import BaseTypeRegistry from '../../jel/BaseTypeRegistry';
import Category from '../dbObjects/Category';
import Class from '../../jel/types/Class';


/**
 * Declares a property that is a reference to a Category. 
 */
export default class CategoryType extends TypeDescriptor {
  static clazz: Class|undefined;

  constructor(public superCategory?: string) {
    super('CategoryType');
  }
  
  get clazz(): Class {
    return CategoryType.clazz!;
  }

  checkType(ctx: Context, value: JelObject|null): JelBoolean|Promise<JelBoolean> {
    if (value && TypeChecker.isIDbRef(value))
      return (value as any).with(ctx, (v: any)=>this.checkType(ctx, v));
    if (!(value instanceof Category))
      return JelBoolean.FALSE;
    if (!this.superCategory)
      return JelBoolean.TRUE;

    const cat: Category = value;
    if (cat.distinctName == this.superCategory)
      return JelBoolean.TRUE;
    if (!cat.superCategory)
      return JelBoolean.FALSE;
    if (cat.superCategory!.distinctName == this.superCategory)
      return JelBoolean.TRUE;
    return cat.superCategory.with(ctx, sc=>this.checkType(ctx, sc)) as any;
  }
  
  getSerializationProperties(): any[] {
    return [this.superCategory];
  }
  
  serializeType(): string {  
    if (!this.superCategory)
      return 'CategoryType()';
    else
      return `CategoryType(${Serializer.serialize(this.superCategory)})`;
  }
  
  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean {
    return JelBoolean.valueOf(other instanceof CategoryType && (this.superCategory ? (other.superCategory!=null && other.superCategory==this.superCategory) : !other.superCategory));
  }
  
  static create_jel_mapping = true;
  static create(ctx: Context, clazz: any, ...args: any[]) {
    if (!args[0])
      return new CategoryType();
    return new CategoryType(args[0] instanceof JelString ? args[0].value : TypeChecker.dbRef(args[0], 'superCategory').distinctName);
  }
}

BaseTypeRegistry.register('CategoryType', CategoryType);


