import TypeDescriptor from './TypeDescriptor';
import TypeHelper from './TypeHelper';
import {IDbRef} from '../../IDatabase';
import Dictionary from '../../types/Dictionary';
import List from '../../types/List';
import TypeChecker from '../../types/TypeChecker';
import BaseTypeRegistry from '../../BaseTypeRegistry';
import Context from '../../Context';
import JelObject from '../../JelObject';
import SerializablePrimitive from '../../SerializablePrimitive';
import JelBoolean from '../JelBoolean';


/**
 * Represets any type, including null.
 */
export default class AnyType extends TypeDescriptor {
  static readonly instance = new AnyType();
  
  constructor() {
    super();
  }
  
  getSerializationProperties(): Object {
    return [];
  }
	
  checkType(ctx: Context, value: JelObject|null): JelBoolean {
    return JelBoolean.TRUE;
  }
  
  convert(ctx: Context, value: JelObject|null): JelObject|null {
    return value;
  }
  
  serializeType(): string {
    return 'any';
  }
  
  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean {
    return JelBoolean.valueOf(other instanceof AnyType);
  }

  
  serializeToString() : string {
		return this.serializeType();
	}
}

BaseTypeRegistry.register('AnyType', AnyType);



