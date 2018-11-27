import TypeDescriptor from './TypeDescriptor';
import TypeHelper from './TypeHelper';
import List from '../List';
import TypeChecker from '../TypeChecker';
import {IDbRef, IDbEntry} from '../../IDatabase';
import Dictionary from '../../types/Dictionary';
import Context from '../../Context';
import JelObject from '../../JelObject';



/**
 * Declares a property type that is a list.
 */
export default class ListType extends TypeDescriptor {
	public types: TypeDescriptor;
	
	/**
	 * types - one or more Types to define the acceptable member types of the list. 
	 *         The List may also contain 'null' as element, if the List can have nulls.
	 */
  constructor(types: List|TypeDescriptor|IDbRef|Dictionary) {
    super();
		this.types = TypeHelper.convert(types);
  }
  
  checkType(ctx: Context, value: JelObject|null): boolean {
    if (!(value instanceof List))
      return false;
    
    return value.hasOnlyJs(v=>this.types.checkType(ctx, v as any));
  }
  
  getSerializationProperties(): Object {
    return [this.types];
  }

  static create_jel_mapping = {types: 1};
  static create(ctx: Context, ...args: any[]) {
    const vt = args[0] instanceof List || args[0] instanceof TypeDescriptor || args[0] instanceof Dictionary ? args[0] : TypeChecker.dbRef(args[0], 'types');
    return new ListType(vt);
  }
}




