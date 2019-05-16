import TypeDescriptor from '../../jel/types/typeDescriptors/TypeDescriptor';
import {IDbRef} from '../../jel/IDatabase';
import TypeChecker from '../../jel/types/TypeChecker';
import JelBoolean from '../../jel/types/JelBoolean';
import JelString from '../../jel/types/JelString';
import Context from '../../jel/Context';
import JelObject from '../../jel/JelObject';
import Serializer from '../../jel/Serializer';
import BaseTypeRegistry from '../../jel/BaseTypeRegistry';
import Category from '../dbObjects/Category';
import Thing from '../dbObjects/Thing';
import Class from '../../jel/types/Class';


/**
 * Declares a property that is a reference to a Thing.
 */
export default class ThingType extends TypeDescriptor {
  static clazz: Class|undefined;
  static instance = new ThingType();

  constructor(public category?: IDbRef) {
    super('ThingType');
  }
  
  get clazz(): Class {
    return ThingType.clazz!;
  }

  static checkCategory(ctx: Context, checkCat: string, cat: IDbRef): JelBoolean|Promise<JelBoolean> {
    if (checkCat == cat.distinctName)
      return JelBoolean.TRUE;
    
    return cat.with(ctx, (rc: any)=>rc.superCategory ? (rc.superCategory.distinctName == checkCat ? JelBoolean.TRUE : ThingType.checkCategory(ctx, checkCat, rc.superCategory)) : JelBoolean.FALSE) as any;
  }
  
  checkType(ctx: Context, value: JelObject|null): JelBoolean|Promise<JelBoolean> {
    if (value && TypeChecker.isIDbRef(value))
      return (value as any).with(ctx, (v: any)=>this.checkType(ctx, v));
    if (!(value instanceof Thing))
      return JelBoolean.FALSE;
    if (!this.category)
      return JelBoolean.TRUE;

    return ThingType.checkCategory(ctx, this.category.distinctName, (value as Thing).category);
  }
  
  getSerializationProperties(): any[] {
    return [this.category];
  }
  
  serializeType(): string {  
    if (!this.category)
      return 'thing';
    else
      return `ThingType(${Serializer.serialize(this.category)})`;
  }
  
  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean|Promise<JelBoolean> {
    if (other && other.constructor.name == 'ReferenceDispatcherType')
      return other.equals(ctx, this);
    return JelBoolean.valueOf(other instanceof ThingType && (this.category ? (other.category!=null && other.category.distinctName==this.category.distinctName) : !other.category));
  }
  
  create(ctx: Context, ...args: any[]) {
    return ThingType.create(ctx, ...args);
  }
  
  static create_jel_mapping = true;
  static create(ctx: Context, ...args: any[]) {
    if (!args[0])
      return ThingType.instance;
    return new ThingType(args[0] instanceof JelString ? ctx.dbSession!.createDbRef(args[0]) : TypeChecker.optionalDbRef(args[0], 'category'));
  }
}


const p: any = ThingType.prototype;
p.create_jel_mapping = true;

BaseTypeRegistry.register('ThingType', ThingType);


