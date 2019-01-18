import TypeDescriptor from './TypeDescriptor';
import {IDbRef} from '../../IDatabase';
import TimeDescriptor from '../../types/time/TimeDescriptor';
import ZonedDate from '../../types/time/ZonedDate';
import Runtime from '../../Runtime';
import Context from '../../Context';
import JelObject from '../../JelObject';
import Serializer from '../../Serializer';
import SerializablePrimitive from '../../SerializablePrimitive';
import JelBoolean from '../JelBoolean';
import BaseTypeRegistry from '../../BaseTypeRegistry';


/**
 * Declares a property that is a time.
 */
export default class TimeType extends TypeDescriptor {
  static readonly instance = new TimeType();

  constructor() {
    super();
  }
  
  // note: constants and types are not checked yet. That would become async.
  checkType(ctx: Context, value: JelObject|null): JelBoolean {
    return JelBoolean.valueOf(value instanceof TimeDescriptor);
  }
  
  serializeType(): string {
    return 'time';
  }
  
  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean {
    return JelBoolean.valueOf(other instanceof TimeType);
  }
  
  serializeToString() : string {
		return this.serializeType();
	}
}
