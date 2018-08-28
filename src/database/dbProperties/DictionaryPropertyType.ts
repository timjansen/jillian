import PropertyType from './PropertyType';
import PropertyHelper from './PropertyHelper';
import SimplePropertyType from './SimplePropertyType';
import CategoryPropertyType from './CategoryPropertyType';
import DbRef from '../DbRef';
import Dictionary from '../../jel/types/Dictionary';
import List from '../../jel/types/List';
import Context from '../../jel/Context';



/**
 * Declares a property type that is a Dictionary.
 */
export default class DictionaryPropertyType extends PropertyType {
	public keyType: SimplePropertyType;
	public valueTypes: PropertyType;
	
	/**
	 * @param valueTypes one or more PropertyTypes or DbRefs to define the acceptable member types for the values. 
	 *              DbRefs will be converted to SimplePropertyTypes. Dictionary into DictionaryPropertyType.
	 *              The List may also contain 'null' as element, if values can be null.
	 */
  constructor(keyType: DbRef|SimplePropertyType, valueTypes: List|PropertyType|DbRef|Dictionary) {
    super();
		this.keyType = PropertyHelper.convert(keyType) as SimplePropertyType;
		this.valueTypes = PropertyHelper.convert(valueTypes);
  }
  
  getSerializationProperties(): Object {
    return [this.keyType, this.valueTypes];
  }

  static create_jel_mapping = {keyTypes: 1, valueTypes: 2};
  static create(ctx: Context, ...args: any[]) {
    return new DictionaryPropertyType(args[0], args[1]);
  }
}




