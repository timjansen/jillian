import JelObject from '../JelObject';
import TypedParameterValue from '../TypedParameterValue';
import TypeDescriptor from './typeDescriptors/TypeDescriptor';
import TypeHelper from './typeDescriptors/TypeHelper';
import TypeChecker from './TypeChecker';
import JelBoolean from './JelBoolean';
import Context from '../Context';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Serializer from '../Serializer';
import Util from '../../util/Util';


export default class Property extends TypedParameterValue {
  
  constructor(name: string, defaultValue: JelObject|null|undefined, type: TypeDescriptor|null, public isNative = false, defaultValueProvided = true) {
		super(name, defaultValue, type, defaultValueProvided);
  }
  
  getSerializationProperties(): Object {
    return [this.name, this.defaultValue, this.type, this.isNative, this.defaultValueProvided];
  }
  
	toString(): string {
    const prefix = this.isNative?'native ':'';
    if (this.isNameOnly)
      return prefix+this.name;
    else if (!this.type)
      return `${prefix}${this.name} = ${Serializer.serialize(this.defaultValue)}`;
    else if (!this.defaultValue)
      return `${prefix}${this.name}: ${this.type.serializeType()}`;
    else
      return `${prefix}${this.name}: ${this.type.serializeType()} = ${Serializer.serialize(this.defaultValue)}`;
	}
  
  static valueOf(name: string, defaultValue: JelObject|null|undefined, type: TypeDescriptor|null, isNative = false): Property {
    return new Property(name, defaultValue, type, isNative);
  }


  static create_jel_mapping = ['name', 'defaultValue', 'type', 'isNative', 'defaultValueProvided'];
  static create(ctx: Context, ...args: any[]) {
    return new Property(TypeChecker.realString(args[0], 'name'), args[1], 
                        TypeHelper.convertNullableFromAny(args[2], 'type'), 
                        TypeChecker.realBoolean(args[3], 'isNative', false),
                        TypeChecker.realBoolean(args[4], 'defaultValueProvided', true));
  }
   
}

BaseTypeRegistry.register('Property', Property);