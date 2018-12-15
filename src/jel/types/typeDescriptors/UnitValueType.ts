import TypeDescriptor from './TypeDescriptor';
import {IDbRef} from '../../IDatabase';
import Unit from '../../types/Unit';
import UnitValue from '../../types/UnitValue';
import TypeChecker from '../../types/TypeChecker';
import Runtime from '../../Runtime';
import Context from '../../Context';
import JelObject from '../../JelObject';
import Serializer from '../../Serializer';
import JelBoolean from '../JelBoolean';


/**
 * Defines a UnitValue with the given unit.
 */
export default class UnitValueType extends TypeDescriptor {

  constructor(public unit: Unit) {
    super();
  }
  
  checkType(ctx: Context, value: JelObject|null): JelBoolean {
    return JelBoolean.valueOf(value instanceof UnitValue && value.unit.equals(this.unit));
  }
  
  getSerializationProperties(): Object {
    return [this.unit];
  }
  
  serializeType(): string {  
    return Serializer.serialize(this);
  }
	
  static create_jel_mapping = ['unit'];
  static create(ctx: Context, ...args: any[]) {
    return new UnitValueType(args[0] instanceof Unit ? args[0] : Unit.create(ctx, args[0]));
  }
}




