import JelObject from './JelObject';
import TypeDescriptor from './types/typeDescriptors/TypeDescriptor';
import Context from './Context';
import Serializer from './Serializer';
import Util from '../util/Util';


export default class LambdaArgument extends JelObject {
  
  constructor(public name: string, public defaultValue: JelObject|null, public type: TypeDescriptor|null) {
		super();
  }
   
  get isNameOnly(): boolean {
    return !this.defaultValue && !this.type;
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
   
}
