import JelBoolean from '../../jel/types/JelBoolean';
import TypeDescriptor from '../../jel/types/typeDescriptors/TypeDescriptor';
import {IDbRef} from '../../jel/IDatabase';
import Unit from '../../jel/types/Unit';
import UnitValue from '../../jel/types/UnitValue';
import Range from '../../jel/types/Range';
import TypeChecker from '../../jel/types/TypeChecker';
import Runtime from '../../jel/Runtime';
import Context from '../../jel/Context';
import JelObject from '../../jel/JelObject';
import Serializer from '../../jel/Serializer';
import Util from '../../util/Util';
import BaseTypeRegistry from '../../jel/BaseTypeRegistry';
import Class from '../../jel/types/Class';


/**
 * Defines a UnitValue with the given unit.
 */
export default class UnitValueType extends TypeDescriptor {
  static clazz: Class|undefined;

  constructor(public unit: Unit, public range?: Range) {
    super('UnitValueType');
  }
  
  get clazz(): Class {
    return UnitValueType.clazz!;
  }

  
  checkType(ctx: Context, value: JelObject|null): JelBoolean | Promise<JelBoolean> {
    if (!(value instanceof UnitValue))
      return JelBoolean.FALSE;
    if (value.unit.equals(this.unit))
      return this.range ? this.range.contains(ctx, value) : JelBoolean.TRUE;
    else
      return Util.resolveValue(value.canConvertTo(ctx, this.unit), r=>r.toRealBoolean() ? (this.range ? this.range.contains(ctx, value) : JelBoolean.TRUE) : JelBoolean.FALSE);
  }
  
  convert(ctx: Context, value: JelObject|null, fieldName=''): JelObject|null|Promise<JelObject|null> {
    if (!(value instanceof UnitValue))
      throw new Error(`Can not convert${fieldName?' '+fieldName:''} to UnitValue of type ${this.unit.toString()}`);
  
    return Util.resolveValue(this.range ? this.range.contains(ctx, value) : JelBoolean.TRUE, (c: JelBoolean)=>{
      if (!c.toRealBoolean())
        throw new Error(`Can not convert${fieldName?' '+fieldName:''}: not in range.`);

      if (value.unit.equals(this.unit))
        return value;
    
      const p = value.convertTo(ctx, this.unit);
      if (p instanceof Promise)
        return p.catch(()=>{throw new Error(`Can not convert${fieldName?' '+fieldName:''} from ${value.unit.toString()} to ${this.unit.toString()}`);});
      else
        return p;
    });
  }
    
  getSerializationProperties(): any[] {
    return this.range ? [this.unit, this.range] : [this.unit];
  }
  
  serializeType(): string {  
    return Serializer.serialize(this);
  }
  
  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean|Promise<JelBoolean> {
    if (other && other.constructor.name == 'ReferenceDispatcherType')
      return other.equals(ctx, this);
    return other instanceof UnitValueType && this.unit.equals(other.unit) ? (this.range == null ? JelBoolean.valueOf(other.range == null) : (other.range == null ? JelBoolean.FALSE : Runtime.op(ctx, '===', this.range, other.range) as any)) : JelBoolean.FALSE;
  }
	
  static valueOf(unit: Unit, range?: Range): UnitValueType {
    return new UnitValueType(unit, range);
  }
  
  static create_jel_mapping = ['unit', 'range'];
  static create(ctx: Context, ...args: any[]) {
    return new UnitValueType(args[0] instanceof Unit ? args[0] : Unit.create(ctx, args[0]), TypeChecker.optionalInstance(Range, args[1], 'range'));
  }
}

BaseTypeRegistry.register('UnitValueType', UnitValueType);



