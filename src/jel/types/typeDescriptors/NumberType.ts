import TypeDescriptor from './TypeDescriptor';
import {IDbRef} from '../../IDatabase';
import Float from '../../types/Float';
import Fraction from '../../types/Fraction';
import Runtime from '../../Runtime';
import Context from '../../Context';
import JelObject from '../../JelObject';
import Serializer from '../../Serializer';
import SerializablePrimitive from '../../SerializablePrimitive';
import JelBoolean from '../JelBoolean';


/**
 * Declares a property that is a Float or Fraction representing a number.
 */
export default class NumberType extends TypeDescriptor {
  static readonly instance = new NumberType();

  constructor() {
    super();
  }
  
  // note: constants and types are not checked yet. That would become async.
  checkType(ctx: Context, value: JelObject|null): JelBoolean {
    return JelBoolean.valueOf(value instanceof Float || value instanceof Fraction);
  }
  
  serializeType(): string {
    return 'number';
  }
  
  serializeToString() : string {
		return this.serializeType();
	}
}




