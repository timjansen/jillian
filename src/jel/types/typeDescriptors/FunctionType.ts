import TypeDescriptor from './TypeDescriptor';
import List from '../List';
import TypeChecker from '../TypeChecker';
import Callable from '../../Callable';
import Context from '../../Context';
import JelObject from '../../JelObject';
import Serializer from '../../Serializer';

/**
 * Declares a property type that is either a JEL function or a method.
 */
export default class FunctionType extends TypeDescriptor {
	public arguments: List;
	
	/**
	 * A list of strings that represent argument names for the function.
	 */
  constructor(public args: List) {
    super();
  }

  checkType(ctx: Context, value: JelObject|null): boolean {
    return value instanceof Callable;
  }
  
  getSerializationProperties(): Object {
    return [this.args];
  }

  serializeType(): string {
    return Serializer.serialize(this);
  }

  
  static create_jel_mapping = ['arguments'];
  static create(ctx: Context, ...args: any[]) {
    return new FunctionType(TypeChecker.listOfStrings(args[0], 'arguments'));
  }
}




