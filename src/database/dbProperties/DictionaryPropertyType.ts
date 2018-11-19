import PropertyType from './PropertyType';
import PropertyHelper from './PropertyHelper';
import SimplePropertyType from './SimplePropertyType';
import CategoryPropertyType from './CategoryPropertyType';
import {IDbRef, IDbEntry} from '../../jel/IDatabase';
import Dictionary from '../../jel/types/Dictionary';
import List from '../../jel/types/List';
import TypeChecker from '../../jel/types/TypeChecker';
import JelObject from '../../jel/JelObject';
import Context from '../../jel/Context';



/**
 * Declares a property type that is a Dictionary.
 */
export default class DictionaryPropertyType extends PropertyType {
	public valueTypes: PropertyType|null;
	
	/**
	 * @param valueTypes one or more PropertyTypes or DbRefs to define the acceptable member types for the values. 
	 *              DbRefs will be converted to SimplePropertyTypes. Dictionary into DictionaryPropertyType.
	 *              The List may also contain 'null' as element, if values can be null.
	 */
  constructor(valueTypes: List|PropertyType|IDbRef|Dictionary|null) {
    super();
		this.valueTypes = valueTypes && PropertyHelper.convert(valueTypes);
  }
  
   checkProperty(ctx: Context, value: JelObject|null): boolean {
    if (!(value instanceof Dictionary))
      return false;
    if (!this.valueTypes)
      return true;
     
    return value.hasOnlyJs((k,v)=>this.valueTypes!.checkProperty(ctx, v));
  }
  
  getSerializationProperties(): Object {
    return [this.valueTypes];
  }

  static create_jel_mapping = {valueTypes: 1};
  static create(ctx: Context, ...args: any[]) {
    const vt = args[1] instanceof List || args[1] instanceof PropertyType || args[1] instanceof Dictionary ? args[1] : TypeChecker.optionalDbRef(args[1], 'valueTypes');
    return new DictionaryPropertyType(vt);
  }
}




