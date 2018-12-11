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
	
  checkType(ctx: Context, value: JelObject|null): boolean {
    return true;
  }
  
  serializeType(): string {
    return 'any';
  }
  
  serializeToString() : string {
		return this.serializeType();
	}
}

BaseTypeRegistry.register('AnyType', AnyType);



