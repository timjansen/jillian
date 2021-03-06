import TypeDescriptor from './TypeDescriptor';
import {IDbRef} from '../../IDatabase';
import Dictionary from '../../types/Dictionary';
import TypeChecker from '../../types/TypeChecker';
import Runtime from '../../Runtime';
import Context from '../../Context';
import JelObject from '../../JelObject';
import Serializer from '../../Serializer';
import JelBoolean from '../JelBoolean';
import BaseTypeRegistry from '../../BaseTypeRegistry';
import Class from '../Class';


/**
 * Declares a property that just holds a single value. 
 * If the given type is a Category, only its things are allowed. 
 * If it's one of the base types, only instances of the base type.
 * If it is an enum type, only that enum is allowed.
 */
export default class SimpleType extends TypeDescriptor {
  static clazz: Class|undefined;

  constructor(public type: string) {
    super('SimpleType');
  }
  
  get clazz(): Class {
    return SimpleType.clazz!;
  }
  
  checkType(ctx: Context, value: JelObject|null): JelBoolean {
    return JelBoolean.valueOf(Runtime.instanceOf(ctx, value, this.type));
  }
  
  getSerializationProperties(): any[] {
    return [this.type];
  }
  
  serializeType(): string {
    return `SimpleType("${this.type}")`;
  }
  
  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean {
    return JelBoolean.valueOf(other instanceof SimpleType && this.type == other.type);
  }
	
  static valueOf(type: string): SimpleType {
    return new SimpleType(type);
  }
  
  static create_jel_mapping = true;
  static create(ctx: Context, ...args: any[]) {
    const type = args[0] instanceof Class ? args[0].name : TypeChecker.isIDbRef(args[0]) ? args[0].distinctName : TypeChecker.realString(args[0], 'type');
    return new SimpleType(type);
  }
}

BaseTypeRegistry.register('SimpleType', SimpleType);



