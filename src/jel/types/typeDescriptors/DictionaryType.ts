import TypeDescriptor from './TypeDescriptor';
import TypeHelper from './TypeHelper';
import {IDbRef, IDbEntry} from '../../IDatabase';
import Dictionary from '../Dictionary';
import List from '../List';
import TypeChecker from '../TypeChecker';
import JelObject from '../../JelObject';
import Context from '../../Context';



/**
 * Declares a property type that is a Dictionary.
 */
export default class DictionaryType extends TypeDescriptor {
	public valueTypes: TypeDescriptor|null;
	
	/**
	 * @param valueTypes one or more Types or DbRefs to define the acceptable member types for the values. 
	 *              DbRefs will be converted to SimpleTypes. Dictionary into DictionaryType.
	 *              The List may also contain 'null' as element, if values can be null.
	 */
  constructor(valueTypes: List|TypeDescriptor|IDbRef|Dictionary|null) {
    super();
		this.valueTypes = valueTypes && TypeHelper.convert(valueTypes);
  }
  
   checkType(ctx: Context, value: JelObject|null): boolean {
    if (!(value instanceof Dictionary))
      return false;
    if (!this.valueTypes)
      return true;
     
    return value.hasOnlyJs((k,v)=>this.valueTypes!.checkType(ctx, v));
  }
  
  getSerializationProperties(): Object {
    return [this.valueTypes];
  }

  static create_jel_mapping = {valueTypes: 1};
  static create(ctx: Context, ...args: any[]) {
    const vt = args[1] instanceof List || args[1] instanceof TypeDescriptor || args[1] instanceof Dictionary ? args[1] : TypeChecker.optionalDbRef(args[1], 'valueTypes');
    return new DictionaryType(vt);
  }
}



