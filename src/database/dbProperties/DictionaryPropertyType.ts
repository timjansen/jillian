import PropertyType from './PropertyType';
import PropertyHelper from './PropertyHelper';
import SimplePropertyType from './SimplePropertyType';
import CategoryPropertyType from './CategoryPropertyType';
import {IDbRef, IDbEntry} from '../../jel/IDatabase';
import Dictionary from '../../jel/types/Dictionary';
import List from '../../jel/types/List';
import TypeChecker from '../../jel/types/TypeChecker';
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
  constructor(keyType: IDbRef|SimplePropertyType, valueTypes: List|PropertyType|IDbRef|Dictionary) {
    super();
		this.keyType = PropertyHelper.convert(keyType) as SimplePropertyType;
		this.valueTypes = PropertyHelper.convert(valueTypes);
  }
  
  getSerializationProperties(): Object {
    return [this.keyType, this.valueTypes];
  }

  static create_jel_mapping = {keyType: 1, valueTypes: 2};
  static create(ctx: Context, ...args: any[]) {
    const keyType  = args[0] instanceof SimplePropertyType ? args[0] : TypeChecker.dbRef(args[0], 'keyType');
    const vt = args[1] instanceof List || args[1] instanceof PropertyType || args[1] instanceof Dictionary ? args[1] : TypeChecker.dbRef(args[1], 'valueTypes');
    return new DictionaryPropertyType(keyType, vt);
  }
}




