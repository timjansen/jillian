import TypeDescriptor from './TypeDescriptor';
import {IDbRef} from '../../IDatabase';
import Float from '../../types/Float';
import Fraction from '../../types/Fraction';
import Runtime from '../../Runtime';
import Context from '../../Context';
import JelObject from '../../JelObject';
import SerializablePrimitive from '../../SerializablePrimitive';


/**
 * Declares a property that is a Float or Fraction representing an integer.
 */
export default class IntType extends TypeDescriptor {
  static readonly instance = new IntType();

  constructor() {
    super();
  }
  
  // note: constants and types are not checked yet. That would become async.
  checkType(ctx: Context, value: JelObject|null): boolean {
    const v: any = value;
    return (value instanceof Float || value instanceof Fraction) && Number.isInteger((value as any).toFloat().value);
  }
  
  serializeType(): string {
    return 'int';
  }
  
  serializeToString() : string {
		return this.serializeType();
	}
}




