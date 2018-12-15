import TypeDescriptor from '../../jel/types/typeDescriptors/TypeDescriptor';
import {IDbRef, IDbEntry} from '../../jel/IDatabase';
import Dictionary from '../../jel/types/Dictionary';
import TypeChecker from '../../jel/types/TypeChecker';
import JelBoolean from '../../jel/types/JelBoolean';
import Context from '../../jel/Context';
import JelObject from '../../jel/JelObject';
import Serializer from '../../jel/Serializer';
import BaseTypeRegistry from '../../jel/BaseTypeRegistry';
import Category from '../dbObjects/Category';


/**
 * Declares a property that is a reference to a Category. 
 */
export default class CategoryType extends TypeDescriptor {

  constructor(public superCategory: IDbRef | null) {
    super();
  }

  checkType(ctx: Context, value: JelObject|null): JelBoolean|Promise<JelBoolean> {
    if (value && TypeChecker.isIDbRef(value))
      return (value as any).with(ctx, (v: any)=>this.checkType(ctx, v));
    if (!(value instanceof Category))
      return JelBoolean.FALSE;
    if (!this.superCategory)
      return JelBoolean.TRUE;

    const cat: Category = value;
    if (cat.distinctName == this.superCategory.distinctName)
      return JelBoolean.TRUE;
    if (!cat.superCategory)
      return JelBoolean.FALSE;
    if (cat.superCategory!.distinctName == this.superCategory.distinctName)
      return JelBoolean.TRUE;
    return cat.superCategory.with(ctx, sc=>this.checkType(ctx, sc)) as any;
  }
  
  getSerializationProperties(): Object {
    return [this.superCategory];
  }
  
  serializeType(): string {  
    if (!this.superCategory)
      return 'CategoryType()';
    else
      return `CategoryType(${Serializer.serialize(this.superCategory)})`;
  
  }
  
  static create_jel_mapping = {superCategory: 1};
  static create(ctx: Context, ...args: any[]) {
    return new CategoryType(TypeChecker.optionalDbRef(args[0], 'superCategory'));
  }
}

BaseTypeRegistry.register('CategoryType', CategoryType);


