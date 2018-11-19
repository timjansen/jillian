import PropertyType from './PropertyType';
import PropertyHelper from './PropertyHelper';
import {IDbRef} from '../../jel/IDatabase';
import Dictionary from '../../jel/types/Dictionary';
import List from '../../jel/types/List';
import TypeChecker from '../../jel/types/TypeChecker';
import Context from '../../jel/Context';
import JelObject from '../../jel/JelObject';


/**
 * Declares a property can have more than one value.
 */
export default class OptionPropertyType extends PropertyType {
	options: List; // of PropertyType
	
  constructor(options: List|PropertyType|IDbRef|Dictionary) {
    super();
		this.options = new List(options instanceof List ? options.elements.map(e=>PropertyHelper.convertNullableFromAny(e, 'list of property types')) : [PropertyHelper.convertNullableFromAny(options, 'list of property types')]);
  }
  
  getSerializationProperties(): Object {
    return [this.options];
  }
	
  checkProperty(ctx: Context, value: JelObject|null): boolean {
    return this.options.hasAnyJs(option=>option&&(option as any).checkProperty(ctx, value));
  }
  
  static create_jel_mapping = {options: 1};
  static create(ctx: Context, ...args: any[]) {
    const vt = args[0] instanceof List || args[0] instanceof PropertyType || args[0] instanceof Dictionary ? args[0] : TypeChecker.dbRef(args[0], 'options');
    return new OptionPropertyType(vt);
  }
}




