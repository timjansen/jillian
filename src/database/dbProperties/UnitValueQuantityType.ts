import TypeDescriptor from '../../jel/types/typeDescriptors/TypeDescriptor';
import {IDbRef} from '../../jel/IDatabase';
import TypeChecker from '../../jel/types/TypeChecker';
import JelBoolean from '../../jel/types/JelBoolean';
import UnitValue from '../../jel/types/UnitValue';
import Context from '../../jel/Context';
import JelObject from '../../jel/JelObject';
import Serializer from '../../jel/Serializer';
import BaseTypeRegistry from '../../jel/BaseTypeRegistry';
import Category from '../dbObjects/Category';
import Thing from '../dbObjects/Thing';


/**
 * Declares a property that is a reference to a UnitValue of a type compatible with the given quantity category.
 */
export default class UnitValueQuantityType extends TypeDescriptor {
  constructor(public quantityCategory: IDbRef) {
    super();
  }

  checkType(ctx: Context, value: JelObject|null): JelBoolean|Promise<JelBoolean> {
    if (!(value instanceof UnitValue && value.isSimple()))
      return JelBoolean.FALSE;

    return (value as UnitValue).toSimpleType(ctx).withMember(ctx, 'quantityCategory', (quantityCategory: any)=>JelBoolean.valueOf(quantityCategory.distinctName == this.quantityCategory.distinctName));
  }
  
  getSerializationProperties(): Object {
    return [this.quantityCategory];
  }
  
  serializeType(): string {  
    return `UnitValueQuantityType(${Serializer.serialize(this.quantityCategory)})`;
  }
  
  static create_jel_mapping = {quantityCategory: 1};
  static create(ctx: Context, ...args: any[]) {
    return new UnitValueQuantityType(TypeChecker.dbRef(args[0], 'quantityCategory'));
  }
}

BaseTypeRegistry.register('UnitValueQuantityType', UnitValueQuantityType);


