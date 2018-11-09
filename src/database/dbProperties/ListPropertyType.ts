import PropertyType from './PropertyType';
import PropertyHelper from './PropertyHelper';
import List from '../../jel/types/List';
import TypeChecker from '../../jel/types/TypeChecker';
import {IDbRef, IDbEntry} from '../../jel/IDatabase';
import Dictionary from '../../jel/types/Dictionary';
import Context from '../../jel/Context';



/**
 * Declares a property type that is a list.
 */
export default class ListPropertyType extends PropertyType {
	public types: PropertyType;
	
	/**
	 * types - one or more PropertyTypes to define the acceptable member types of the list. 
	 *         The List may also contain 'null' as element, if the List can have nulls.
	 */
  constructor(types: List|PropertyType|IDbRef|Dictionary) {
    super();
		this.types = PropertyHelper.convert(types);
  }
  
  getSerializationProperties(): Object {
    return [this.types];
  }

  static create_jel_mapping = {types: 1};
  static create(ctx: Context, ...args: any[]) {
    const vt = args[0] instanceof List || args[0] instanceof PropertyType || args[0] instanceof Dictionary ? args[0] : TypeChecker.dbRef(args[0], 'types');
    return new ListPropertyType(vt);
  }
}




