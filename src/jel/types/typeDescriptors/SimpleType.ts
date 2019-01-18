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


/**
 * Declares a property that just holds a single value. 
 * If the given type is a Category, only its things are allowed. 
 * If it's one of the base types, only instances of the base type.
 * If it is an enum type, only that enum is allowed.
 */
export default class SimpleType extends TypeDescriptor {

  constructor(public type: string) {
    super();
  }
  
  checkType(ctx: Context, value: JelObject|null): JelBoolean {
    return JelBoolean.valueOf(Runtime.instanceOf(ctx, value, this.type));
  }
  
  getSerializationProperties(): Object {
    return [this.type];
  }
  
  serializeType(): string {  
    return this.type;
  }
  
  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean {
    return JelBoolean.valueOf(other instanceof SimpleType && this.type == other.type);
  }
	
  static create_jel_mapping = ['type'];
  static create(ctx: Context, ...args: any[]) {
    const type = TypeChecker.isIClass(args[0]) ? args[0].className : TypeChecker.isIDbRef(args[0]) ? args[0].distinctName : TypeChecker.realString(args[0], 'type');
    return new SimpleType(type);
  }
}




