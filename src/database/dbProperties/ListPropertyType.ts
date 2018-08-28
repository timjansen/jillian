import PropertyType from './PropertyType';
import PropertyHelper from './PropertyHelper';
import DbRef from '../DbRef';
import List from '../../jel/types/List';
import Dictionary from '../../jel/types/Dictionary';



/**
 * Declares a property type that is a list.
 */
export default class ListPropertyType extends PropertyType {
	public types: PropertyType;
	
	/**
	 * types - one or more PropertyTypes to define the acceptable member types of the list. 
	 *         The List may also contain 'null' as element, if the List can have nulls.
	 */
  constructor(types: List|PropertyType|DbRef|Dictionary) {
    super();
		this.types = PropertyHelper.convert(types);
  }
  
  getSerializationProperties(): Object {
    return [this.types];
  }

  static create_jel_mapping = {types: 0};
  static create(...args: any[]) {
    return new ListPropertyType(args[0]);
  }
}




