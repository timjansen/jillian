import TypeDescriptor from '../../jel/types/typeDescriptors/TypeDescriptor';
import UnitValueType from './UnitValueType';
import {IDbRef} from '../../jel/IDatabase';
import TypeChecker from '../../jel/types/TypeChecker';
import JelBoolean from '../../jel/types/JelBoolean';
import Unit from '../../jel/types/Unit';
import Context from '../../jel/Context';
import JelObject from '../../jel/JelObject';
import Serializer from '../../jel/Serializer';
import BaseTypeRegistry from '../../jel/BaseTypeRegistry';
import Category from '../dbObjects/Category';
import Thing from '../dbObjects/Thing';
import DbRef from '../DbRef';
import DbEntry from '../DbEntry';
import ThingType from './ThingType';
import UnitValueQuantityType from './UnitValueQuantityType';
import Class from '../../jel/types/Class';


/**
 * A helper type to handle references whose target isn't known yet. 
 * It will act as a 
 *   - ThingType if the reference is a category
 *   - UnitValueType if the reference is a thing of UnitOfMeasureCategory
 *   - UnitValueQuantityType if the reference is a thing of QuantityCategory
 */
export default class ReferenceDispatcherType extends TypeDescriptor {
  static clazz: Class|undefined;
  ref: IDbRef|undefined;
  type: TypeDescriptor|undefined;
  
  constructor(public refOrType: IDbRef|TypeDescriptor) {
    super('ReferenceDispatcherType');
    if (refOrType instanceof TypeDescriptor)
      this.type = refOrType;
    else 
      this.ref = refOrType;     
  }
  
  get clazz(): Class {
    return ReferenceDispatcherType.clazz!;
  }

  dispatch(ctx: Context, action: (type: TypeDescriptor)=>any): any {
    if (this.type)
      return action(this.type);
    return this.ref!.with(ctx, (dbe: DbEntry)=>{
      if (dbe instanceof Category)
        this.type = new ThingType(new DbRef(dbe));
      else if (dbe instanceof Thing) {
        if (dbe.category.distinctName == 'UnitOfMeasureCategory')
          this.type = new UnitValueType(new Unit(this.ref!));
        else if (dbe.category.distinctName == 'QuantityCategory')
          this.type = new UnitValueQuantityType(this.ref!);
        else
          throw new Error(`Unsupported Thing ${dbe.distinctName} as reference type. Category: ${dbe.category.distinctName}.`);
      }
      else
        throw new Error(`Unsupported database entry ${dbe.distinctName} as reference type.`);
      return action(this.type!);
    });
  }

  checkType(ctx: Context, value: JelObject|null): JelBoolean|Promise<JelBoolean> {
    return this.dispatch(ctx, (type: TypeDescriptor)=>type.checkType(ctx, value));
  }
  
  convert(ctx: Context, value: JelObject|null, fieldName=''):  JelObject|null|Promise<JelObject|null> {
    return this.dispatch(ctx, (type: TypeDescriptor)=>type.convert(ctx, value));
  }

  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean|Promise<JelBoolean> {
    return this.dispatch(ctx, type=>other instanceof ReferenceDispatcherType ? other.dispatch(ctx, otherType=>type.equals(ctx, otherType)) : type.equals(ctx, other));
  }

  getSerializationProperties(): any[] {
    return [this.type||this.ref];
  }
  
  serializeType(): string {  
    if (this.type)
      return this.type.serializeType();
    else
      return `ReferenceDispatcherType(${Serializer.serialize(this.ref)})`;
  }
  
  static valueOf(r: IDbRef|TypeDescriptor): ReferenceDispatcherType {
    return new ReferenceDispatcherType(r);
  }
  
  static create_jel_mapping = ['ref'];
  static create(ctx: Context, ...args: any[]) {
    return new ReferenceDispatcherType(args[0] instanceof TypeDescriptor ? args[0] : TypeChecker.dbRef(args[0], 'ref'));
  }
}

BaseTypeRegistry.register('ReferenceDispatcherType', ReferenceDispatcherType);


