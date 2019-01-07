import JelObject from './JelObject';
import TypeDescriptor from './types/typeDescriptors/TypeDescriptor';
import TypeChecker from './types/TypeChecker';
import JelBoolean from './types/JelBoolean';
import Context from './Context';
import Serializer from './Serializer';
import Util from '../util/Util';


export default class TypedParameterValue extends JelObject {
  
  constructor(public name: string, public defaultValue: JelObject|null, public type: TypeDescriptor|null) {
		super();
  }
   
  get isNameOnly(): boolean {
    return !this.defaultValue && !this.type;
  }
  
  getSerializationProperties(): Object {
    return [this.name, this.defaultValue, this.type];
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
  
  compatibleWith(ctx: Context, other: TypedParameterValue): JelBoolean|Promise<JelBoolean> {
    return this.name == other.name ? TypeDescriptor.equals(ctx, this.type,  other.type) : JelBoolean.FALSE;
  }
  
  static create_jel_mapping = ['name', 'defaultValue', 'type'];
  static create(ctx: Context, ...args: any[]) {
    return new TypedParameterValue(TypeChecker.realString(args[0], 'name'), args[1], TypeChecker.optionalInstance(TypeDescriptor, args[2], 'type'));
  }
   
}
