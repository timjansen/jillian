import TypeDescriptor from './TypeDescriptor';
import TypeHelper from './TypeHelper';
import List from '../List';
import TypeChecker from '../TypeChecker';
import {IDbRef, IDbEntry} from '../../IDatabase';
import Dictionary from '../../types/Dictionary';
import Context from '../../Context';
import JelObject from '../../JelObject';
import BaseTypeRegistry from '../../BaseTypeRegistry';



/**
 * Declares a property type that is a list.
 */
export default class ListType extends TypeDescriptor {
	public types: TypeDescriptor;
	
	/**
	 * types - one or more Types to define the acceptable member types of the list. 
	 *         The List may also contain 'null' as element, if the List can have nulls.
	 */
  constructor(types: JelObject|null) {
    super();
		this.types = TypeHelper.convertFromAny(types, 'list values');
  }
  
  checkType(ctx: Context, value: JelObject|null): boolean {
    if (!(value instanceof List))
      return false;
    if (!this.types)
      return true;
    
    return value.hasOnlyJs(v=>this.types.checkType(ctx, v as any));
  }
  
  getSerializationProperties(): Object {
    return [this.types];
  }
  
  serializeType(): string {
    return this.types ? `ListType(${this.types.serializeType()})` : `ListType()`;
  }
  
  static valueOf(e: JelObject|null): ListType {
    return new ListType(e);
  }


  static create_jel_mapping = ['types'];
  static create(ctx: Context, ...args: any[]) {
    return new ListType(args[0]);
  }
}

BaseTypeRegistry.register('ListType', ListType);




