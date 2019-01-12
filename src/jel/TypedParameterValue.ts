import JelObject from './JelObject';
import TypeDescriptor from './types/typeDescriptors/TypeDescriptor';
import TypeChecker from './types/TypeChecker';
import JelBoolean from './types/JelBoolean';
import Context from './Context';
import Serializer from './Serializer';
import Util from '../util/Util';


export default class TypedParameterValue extends JelObject {
  
  constructor(public name: string, public defaultValue: JelObject|null|undefined, public type: TypeDescriptor|null, public defaultValueProvided = true) {
		super();
    if (!defaultValueProvided)
      this.defaultValue = undefined;
  }
   
  get isNameOnly(): boolean {
    return !this.defaultValue && !this.type;
  }
  
  getSerializationProperties(): Object {
    return [this.name, this.defaultValue, this.type, this.defaultValueProvided];
  }
  
	toString(): string {
    if (this.isNameOnly)
      return this.name;
    else if (!this.type)
      return `${this.name} = ${Serializer.serialize(this.defaultValue)}`;
    else if (!this.defaultValue)
      return `${this.name}: ${this.type.serializeType()}`;
    else
      return `${this.name}: ${this.type.serializeType()} = ${Serializer.serialize(this.defaultValue)}`;
	}

  static compatibleTypes(ctx: Context, one: TypedParameterValue|null|undefined, other: TypedParameterValue|null|undefined, canOtherBeUntyped = false): JelBoolean|Promise<JelBoolean> {
    if (!one || !other)
      return JelBoolean.valueOf((!one && !other) || (!other && canOtherBeUntyped));

    if (!one.type || !other.type)
      return JelBoolean.valueOf((one.name==other.name) && ((!one.type && !other.type) || (!other.type && canOtherBeUntyped)));
    
    return one.compatibleWith(ctx, other);
  }

  
  compatibleWith(ctx: Context, other: TypedParameterValue): JelBoolean|Promise<JelBoolean> {
    return this.name == other.name ? TypeDescriptor.equals(ctx, this.type,  other.type) : JelBoolean.FALSE;
  }
  
  static create_jel_mapping = ['name', 'defaultValue', 'type', 'defaultValueProvided'];
  static create(ctx: Context, ...args: any[]) {
    return new TypedParameterValue(TypeChecker.realString(args[0], 'name'), args[1], TypeChecker.optionalInstance(TypeDescriptor, args[2], 'type'), TypeChecker.realBoolean(args[3], 'defaultValueProvided', true));
  }
   
}
