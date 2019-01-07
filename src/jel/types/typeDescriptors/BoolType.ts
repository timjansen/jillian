import TypeDescriptor from './TypeDescriptor';
import {IDbRef} from '../../IDatabase';
import JelBoolean from '../../types/JelBoolean';
import Runtime from '../../Runtime';
import Context from '../../Context';
import TypeChecker from '../TypeChecker';
import JelObject from '../../JelObject';
import Serializer from '../../Serializer';
import SerializablePrimitive from '../../SerializablePrimitive';


/**
 * Declares a property that is a Boolean. Optionally it only allows full boolean values (false or true) and no fuzzy values in between.
 */
export default class BoolType extends TypeDescriptor {
 	static readonly JEL_PROPERTIES = {fullValues: true};

  static readonly instance = new BoolType(false);
  static readonly fullValues = new BoolType(true);

  constructor(public onlyFullValues = false) {
    super();
  }
  
  // note: constants and types are not checked yet. That would become async.
  checkType(ctx: Context, value: JelObject|null): JelBoolean {
    return JelBoolean.valueOf((value instanceof JelBoolean) && (!this.onlyFullValues || value.state == 0 || value.state == 1));
  }
  
  serializeType(): string {
    if (this.onlyFullValues)
      return 'BoolType.fullValues';
    else
      return 'bool';
  }
  
  serializeToString() : string {
		return this.serializeType();
	}

  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean {
    return JelBoolean.valueOf(other instanceof BoolType && this.onlyFullValues == other.onlyFullValues);
  }

  static create_jel_mapping = ['onlyFullValues'];
  static create(ctx: Context, ...args: any[]): any {
    if (TypeChecker.optionalRealBoolean(args[0], 'onlyFullValues'))
      return BoolType.fullValues;
    else
      return BoolType.instance;
  }
}




