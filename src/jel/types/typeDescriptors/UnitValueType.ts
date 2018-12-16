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
import Util from '../../../util/Util';


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
  
  convert(ctx: Context, value: JelObject|null, fieldName=''): JelObject|null|Promise<JelObject|null> {
    if (!(value instanceof UnitValue))
      throw new Error(`Can not convert${fieldName?' '+fieldName:''} to UnitValue of type ${this.unit.toString()}`);
    
    if (value.unit.equals(this.unit))
      return value;
    
    const p = value.convertTo(ctx, this.unit);
    if (p instanceof Promise)
      return p.catch(()=>{throw new Error(`Can not convert${fieldName?' '+fieldName:''} from ${value.unit.toString()} to ${this.unit.toString()}`);});
    else
      return p;
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




