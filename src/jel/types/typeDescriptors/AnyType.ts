import TypeDescriptor from './TypeDescriptor';
import TypeHelper from './TypeHelper';
import {IDbRef} from '../../IDatabase';
import Dictionary from '../../types/Dictionary';
import Class from '../Class';
import List from '../List';
import TypeChecker from '../TypeChecker';
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
  static clazz: Class|undefined;
  
  constructor() {
    super('AnyType');
  }

  get clazz(): Class {
    return AnyType.clazz!;
  }
  
  getSerializationProperties(): any[] {
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

  isNullable(ctx: Context): boolean {
    return true;
  }
  
  serializeToString() : string {
		return this.serializeType();
	}
  
  static create_jel_mapping =true;
  static create(ctx: Context, ...args: any[]) {
    return AnyType.instance;
  }
}

BaseTypeRegistry.register('AnyType', AnyType);



