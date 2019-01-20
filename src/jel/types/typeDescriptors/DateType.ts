import TypeDescriptor from './TypeDescriptor';
import {IDbRef} from '../../IDatabase';
import LocalDate from '../../types/time/LocalDate';
import ZonedDate from '../../types/time/ZonedDate';
import Runtime from '../../Runtime';
import Context from '../../Context';
import JelObject from '../../JelObject';
import Serializer from '../../Serializer';
import SerializablePrimitive from '../../SerializablePrimitive';
import JelBoolean from '../JelBoolean';
import BaseTypeRegistry from '../../BaseTypeRegistry';


/**
 * Declares a property that is a LocalDate or ZonedDate.
 */
export default class DateType extends TypeDescriptor {
  static readonly instance = new DateType();

  constructor() {
    super();
  }
  
  // note: constants and types are not checked yet. That would become async.
  checkType(ctx: Context, value: JelObject|null): JelBoolean {
    return JelBoolean.valueOf(value instanceof LocalDate || value instanceof ZonedDate);
  }
  
  serializeType(): string {
    return 'date';
  }
  
  serializeToString() : string {
		return this.serializeType();
	}
    
  equals(ctx: Context, other: TypeDescriptor): JelBoolean {
    return JelBoolean.valueOf(other instanceof DateType);
  }
}
BaseTypeRegistry.register('DateType', DateType);
