import PropertyType from './PropertyType';
import DbRef from '../DbRef';
import List from '../../jel/types/List';



/**
 * Declares a property type that is a JEL function.
 */
export default class FunctionPropertyType extends PropertyType {
	public types: List;
	
	/**
	 * A list of strings that represent argument names for the function.
	 */
  constructor(public args: List) {
    super();
  }
  
  getSerializationProperties(): Object {
    return [this.args];
  }

  static create_jel_mapping = {types: 0};
  static create(...args: any[]) {
    return new FunctionPropertyType(args[0]);
  }
}




