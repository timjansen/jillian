import TypeDescriptor from '../../jel/types/typeDescriptors/TypeDescriptor';
import Duration from '../../jel/types/time/Duration';
import JelBoolean from '../../jel/types/JelBoolean';
import UnitValue from '../../jel/types/UnitValue';
import Context from '../../jel/Context';
import JelObject from '../../jel/JelObject';
import Serializer from '../../jel/Serializer';
import BaseTypeRegistry from '../../jel/BaseTypeRegistry';
import UnitValueQuantityType from './UnitValueQuantityType';
import DbRef from '../DbRef';
import Class from '../../jel/types/Class';




/**
 * Declares a property that is a duration.
 */
export default class DurationType extends TypeDescriptor {
  static clazz: Class|undefined;
  static readonly instance = new DurationType();
  static readonly timeUV = new UnitValueQuantityType(new DbRef('Time'));
  
  constructor() {
    super('DurationType');
  }
  
  get clazz(): Class {
    return DurationType.clazz!;
  }
  
  // note: constants and types are not checked yet. That would become async.
  checkType(ctx: Context, value: JelObject|null): JelBoolean|Promise<JelBoolean> {
    if (value instanceof Duration)
      return JelBoolean.TRUE;
    return DurationType.timeUV.checkType(ctx, value);
  }
  
  serializeType(): string {
    return 'duration';
  }
  
  getSerializationProperties(): any[] {
    return [];
  }
  
  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean {
    return JelBoolean.valueOf(other instanceof DurationType);
  }
  serializeToString() : string {
		return this.serializeType();
	}
  
  static create_jel_mapping = true;
  static create(ctx: Context, ...args: any[]) {
    return DurationType.instance;
  }
}

BaseTypeRegistry.register('DurationType', DurationType);