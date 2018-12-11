import TypeDescriptor from './TypeDescriptor';
import TypeHelper from './TypeHelper';
import {IDbRef} from '../../IDatabase';
import Dictionary from '../../types/Dictionary';
import List from '../../types/List';
import TypeChecker from '../../types/TypeChecker';
import BaseTypeRegistry from '../../BaseTypeRegistry';
import Context from '../../Context';
import JelObject from '../../JelObject';


/**
 * Represets a type that can be null. Is a shortcut for OptionType with null
 */
export default class OptionalType extends TypeDescriptor {
	type: TypeDescriptor;
	
  constructor(e: JelObject|null) {
    super();
		this.type = TypeHelper.convertFromAny(e, 'property types');
  }
  
  getSerializationProperties(): Object {
    return [this.type];
  }
	
  checkType(ctx: Context, value: JelObject|null): boolean {
    return value == null || this.type.checkType(ctx, value);
  }
  
  static valueOf(e: JelObject): OptionalType {
    return new OptionalType(e);
  }
  
  serializeType(): string {
    return `${this.type}?`;
  }
    
  static create_jel_mapping = ['type'];
  static create(ctx: Context, ...args: any[]) {
    return new OptionalType(args[0]);
  }
}

BaseTypeRegistry.register('OptionalType', OptionalType);



