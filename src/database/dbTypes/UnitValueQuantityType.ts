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
import Class from '../../jel/types/Class';


/**
 * Declares a property that is a reference to a UnitValue of a type compatible with the given quantity category.
 */
export default class UnitValueQuantityType extends TypeDescriptor {
  static clazz: Class|undefined;

  constructor(public quantityCategory: IDbRef) {
    super('UnitValueQuantityType');
  }
  
  get clazz(): Class {
    return UnitValueQuantityType.clazz!;
  }

  checkType(ctx: Context, value: JelObject|null): JelBoolean|Promise<JelBoolean> {
    if (!(value instanceof UnitValue && value.isSimple()))
      return JelBoolean.FALSE;

    return (value as UnitValue).toSimpleType(ctx).withMember(ctx, 'quantityCategory', (quantityCategory: any)=>JelBoolean.valueOf(quantityCategory.distinctName == this.quantityCategory.distinctName));
  }
  
  getSerializationProperties(): any[] {
    return [this.quantityCategory];
  }
  
  serializeType(): string {  
    return `UnitValueQuantityType(${Serializer.serialize(this.quantityCategory)})`;
  }
  
  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean|Promise<JelBoolean> {
    if (other && other.constructor.name == 'ReferenceDispatcherType')
      return other.equals(ctx, this);
    return JelBoolean.valueOf(other instanceof UnitValueQuantityType && this.quantityCategory.distinctName == other.quantityCategory.distinctName);
  }
  
  static create_jel_mapping = {quantityCategory: 1};
  static create(ctx: Context, clazz: any, ...args: any[]) {
    return new UnitValueQuantityType(TypeChecker.dbRef(args[0], 'quantityCategory'));
  }
}

BaseTypeRegistry.register('UnitValueQuantityType', UnitValueQuantityType);


