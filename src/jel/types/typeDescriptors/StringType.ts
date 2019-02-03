import TypeDescriptor from './TypeDescriptor';
import {IDbRef} from '../../IDatabase';
import JelString from '../../types/JelString';
import Runtime from '../../Runtime';
import Context from '../../Context';
import TypeChecker from '../TypeChecker';
import JelObject from '../../JelObject';
import SerializablePrimitive from '../../SerializablePrimitive';
import JelBoolean from '../JelBoolean';
import BaseTypeRegistry from '../../BaseTypeRegistry';
import Class from '../Class';


/**
 * Declares a property that is a String. By default, empty strings are not allowed.
 */
export default class StringType extends TypeDescriptor implements SerializablePrimitive {
  static clazz: Class|undefined;

  static readonly instance = new StringType(false);
  static readonly allowEmpty = new StringType(true);

  constructor(public allowEmpty = false) {
    super('StringType');
  }

  
  get clazz(): Class {
    return StringType.clazz!;
  }
  
  // note: constants and types are not checked yet. That would become async.
  checkType(ctx: Context, value: JelObject|null): JelBoolean {
    return JelBoolean.valueOf((value instanceof JelString) && (this.allowEmpty || !!value.length));
  }
  
  serializeType(): string {
    if (this.allowEmpty)
      return 'StringType.allowEmpty';
    else
      return 'string';
  }
  
  serializeToString() : string {
		return this.serializeType();
	}
  
  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean {
    return JelBoolean.valueOf(other instanceof StringType && this.allowEmpty == other.allowEmpty);
  }
  
  static create_jel_mapping = ['allowEmpty'];
  static create(ctx: Context, ...args: any[]): any {
    if (TypeChecker.optionalRealBoolean(args[0], 'allowEmpty'))
      return StringType.allowEmpty;
    else
      return StringType.instance;
  }
}

BaseTypeRegistry.register('StringType', StringType);




