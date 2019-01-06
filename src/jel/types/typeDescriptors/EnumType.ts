import TypeDescriptor from './TypeDescriptor';
import {IDbRef} from '../../IDatabase';
import Enum from '../../types/Enum';
import EnumValue from '../../types/EnumValue';
import Runtime from '../../Runtime';
import Context from '../../Context';
import JelObject from '../../JelObject';
import Serializer from '../../Serializer';
import SerializablePrimitive from '../../SerializablePrimitive';
import JelBoolean from '../JelBoolean';


/**
 * Declares a property that is a Enum or ZonedDate.
 */
export default class EnumType extends TypeDescriptor {
  constructor() {
    super();
  }
  
  // note: constants and types are not checked yet. That would become async.
  checkType(ctx: Context, value: JelObject|null): JelBoolean {
    if (!(value instanceof EnumValue))
      return JelBoolean.FALSE;
  }
  
  serializeType(): string {
    return 'EnumType()';
  }
  
  serializeToString() : string {
		return this.serializeType();
	}
}
