import PropertyType from './PropertyType';
import SimplePropertyType from './SimplePropertyType';
import EnumPropertyType from './EnumPropertyType';
import ThingPropertyType from './ThingPropertyType';
import CategoryPropertyType from './CategoryPropertyType';
import DbRef from '../DbRef';
import Dictionary from '../../jel/types/Dictionary';
import List from '../../jel/types/List';



/**
 * Declares a property type that is a Dictionary.
 */
export default class DictionaryPropertyType extends PropertyType {
	public valueTypes: List;
	
	/**
	 * valueTypes - one or more PropertyTypes to define the acceptable member types for the values. 
	 *              The List may also contain 'null' as element, if values can be null.
	 */
  constructor(public keyType: SimplePropertyType|ThingPropertyType|CategoryPropertyType|EnumPropertyType, valueTypes: List|PropertyType) {
    super();
		this.valueTypes = valueTypes instanceof List ? valueTypes : new List([valueTypes]);

  }
  
  getSerializationProperties(): Object {
    return [this.keyType, this.valueTypes];
  }

  static create_jel_mapping = {keyType: 0, valueTypes: 1};
  static create(...args: any[]) {
    return new DictionaryPropertyType(args[0], args[1]);
  }
}




