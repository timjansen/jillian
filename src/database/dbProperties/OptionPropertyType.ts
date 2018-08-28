import PropertyType from './PropertyType';
import PropertyHelper from './PropertyHelper';
import DbRef from '../DbRef';
import Dictionary from '../../jel/types/Dictionary';
import List from '../../jel/types/List';
import Context from '../../jel/Context';


/**
 * Declares a property can have more than one value.
 */
export default class OptionPropertyType extends PropertyType {
	options: List; // of PropertyType
	
  constructor(options: List|PropertyType|DbRef|Dictionary) {
    super();
		this.options = new List(options instanceof List ? options.elements.map(e=>PropertyHelper.convert(e)) : [PropertyHelper.convert(options)]);
  }
  
  getSerializationProperties(): Object {
    return [this.options];
  }
	
  static create_jel_mapping = {options: 1};
  static create(ctx: Context, ...args: any[]) {
    return new OptionPropertyType(args[0]);
  }
}




