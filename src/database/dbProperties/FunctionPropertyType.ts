import PropertyType from './PropertyType';
import List from '../../jel/types/List';
import TypeChecker from '../../jel/types/TypeChecker';
import Callable from '../../jel/Callable';
import Context from '../../jel/Context';
import JelObject from '../../jel/JelObject';



/**
 * Declares a property type that is either a JEL function or a method.
 */
export default class FunctionPropertyType extends PropertyType {
	public arguments: List;
	
	/**
	 * A list of strings that represent argument names for the function.
	 */
  constructor(public args: List) {
    super();
  }

  checkProperty(ctx: Context, value: JelObject|null): boolean {
    return value instanceof Callable;
  }
  
  getSerializationProperties(): Object {
    return [this.args];
  }

  static create_jel_mapping = {arguments: 1};
  static create(ctx: Context, ...args: any[]) {
    return new FunctionPropertyType(TypeChecker.listOfStrings(args[0], 'arguments'));
  }
}




