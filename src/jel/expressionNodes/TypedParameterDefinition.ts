import JelNode from './JelNode';
import JelObject from '../JelObject';
import Context from '../Context';
import TypedParameterValue from '../TypedParameterValue';
import BaseTypeRegistry from '../../jel/BaseTypeRegistry';
import TypeHelper from '../types/typeDescriptors/TypeHelper';
import Serializable from '../Serializable';
import Util from '../../util/Util';

/**
 * Represents an lambda argument, with optional type and default value.
 */
export default class TypedParameterDefinition extends JelNode implements Serializable {
  constructor(public name: string, public defaultValue?: JelNode | undefined, public type?: JelNode | undefined ) {
    super();
  }

  // override
  execute(ctx: Context): TypedParameterValue|Promise<TypedParameterValue> {
    if (!this.defaultValue && !this.type)
      return new TypedParameterValue(this.name, null, null);
    
    const defaultValue = this.defaultValue ? this.defaultValue.execute(ctx) : null;
    const type = this.type ? this.type.execute(ctx) : null;
    return Util.resolveValues((d: JelNode|null, t: JelNode|null)=>new TypedParameterValue(this.name, d, type && TypeHelper.convertNullableFromAny(t, this.name)), defaultValue, type);
  }
 
  get isNameOnly(): boolean {
    return !this.defaultValue && !this.type;
  }
  
  // override
  equals(other?: JelNode): boolean {
		if (!(other instanceof TypedParameterDefinition))
			return false;
		return this.name == other.name && 
      (this.defaultValue == other.defaultValue || (!!this.defaultValue && this.defaultValue.equals(other.defaultValue))) &&
      (this.type == other.type || (!!this.type && this.type.equals(other.type)));
	}
  
  getSerializationProperties(): Object {
    return [this.name, this.defaultValue, this.type];
  }
	
	toString(): string {
    if (!this.defaultValue && !this.type)
      return this.name;
    else if (!this.defaultValue)
  		return `${this.name}: ${this.type!.toString()}`;
    else if (!this.type)
  		return `${this.name} = ${this.defaultValue!.toString()}`;
    else
  		return `${this.name}: ${this.type!.toString()} = ${this.defaultValue!.toString()}`;
	}
}

