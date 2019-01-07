import TypeDescriptor from './TypeDescriptor';
import List from '../List';
import TypeChecker from '../TypeChecker';
import Callable from '../../Callable';
import Context from '../../Context';
import JelObject from '../../JelObject';
import Serializer from '../../Serializer';
import JelBoolean from '../JelBoolean';

/**
 * Declares a property type that is either a JEL function or a method.
 */
export default class FunctionType extends TypeDescriptor {
	/**
	 * A list of strings that represent argument names for the function.
	 */
  constructor(public args?: List) {
    super();
  }

  checkType(ctx: Context, value: JelObject|null): JelBoolean {
    return JelBoolean.valueOf(value instanceof Callable);
  }
  
  getSerializationProperties(): Object {
    return [this.args];
  }

  serializeType(): string {
    return Serializer.serialize(this);
  }
  
  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean {
    return JelBoolean.valueOf(other instanceof FunctionType && (this.args ? (other.args != null && this.args.hasOnlyJs((v,i)=>(v as any).value == (other.args!.elements[i] as any).value)): !other.args));
  }

  
  static create_jel_mapping = ['arguments'];
  static create(ctx: Context, ...args: any[]) {
    return new FunctionType(args[0] == null ? undefined : TypeChecker.listOfStrings(args[0], 'arguments'));
  }
}




