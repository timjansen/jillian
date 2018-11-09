import PropertyType from './PropertyType';
import PropertyHelper from './PropertyHelper';
import {IDbRef} from '../../jel/IDatabase';
import Dictionary from '../../jel/types/Dictionary';
import List from '../../jel/types/List';
import TypeChecker from '../../jel/types/TypeChecker';
import Context from '../../jel/Context';


/**
 * Declares a property can have more than one value.
 */
export default class OptionPropertyType extends PropertyType {
	options: List; // of PropertyType
	
  constructor(options: List|PropertyType|IDbRef|Dictionary) {
    super();
		this.options = new List(options instanceof List ? options.elements.map(e=>PropertyHelper.convertNullable(e)) : [PropertyHelper.convertNullable(options)]);
  }
  
  getSerializationProperties(): Object {
    return [this.options];
  }
	
  static create_jel_mapping = {options: 1};
  static create(ctx: Context, ...args: any[]) {
    const vt = args[0] instanceof List || args[0] instanceof PropertyType || args[0] instanceof Dictionary ? args[0] : TypeChecker.dbRef(args[0], 'options');
    return new OptionPropertyType(vt);
  }
}




