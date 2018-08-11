import PropertyType from './PropertyType';
import DbRef from '../DbRef';
import List from '../../jel/types/List';



/**
 * Declares a property type that is a list.
 */
export default class ListPropertyType extends PropertyType {
	public types: List;
	
	/**
	 * types - one or more PropertyTypes to define the acceptable member types of the list. 
	 *         The List may also contain 'null' as element, if the List can have nulls.
	 */
  constructor(types: List|PropertyType) {
    super();
		this.types = types instanceof List ? types : new List([types]);
  }
  
  getSerializationProperties(): Object {
    return [this.types];
  }

  static create_jel_mapping = {types: 0};
  static create(...args: any[]) {
    return new ListPropertyType(args[0]);
  }
}




