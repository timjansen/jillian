import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import Context from '../Context';
import TypedParameterValue from '../TypedParameterValue';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Serializable from '../Serializable';
import Util from '../../util/Util';

/**
 * Represents an lambda argument, with optional type and default value.
 */
export default class TypedParameterDefinition extends CachableJelNode implements Serializable {
 	private typeHelper: any;	
  constructor(public name: string, public defaultValue?: JelNode | undefined, public type?: JelNode | undefined ) {
    super();
    this.typeHelper = BaseTypeRegistry.get('TypeHelper');
  }

  // override
  executeUncached(ctx: Context): TypedParameterValue|Promise<TypedParameterValue> {
    if (!this.defaultValue && !this.type)
      return new TypedParameterValue(this.name, null, null);
    
    const defaultValue = this.defaultValue ? this.defaultValue.execute(ctx) : undefined;
    const type = this.type ? this.type.execute(ctx) : null;
    return Util.resolveValues((d: JelNode|null, t: JelNode|null)=>new TypedParameterValue(this.name, d, type && this.typeHelper.convertNullableFromAny(t, this.name)), defaultValue, type);
  }
  
  isStaticUncached(ctx: Context): boolean {
    return ((!this.defaultValue || this.defaultValue.isStatic(ctx)) && (!this.type || this.type.isStatic(ctx)))
  }
  
  flushCache(): void {
    super.flushCache();
    if (this.defaultValue) this.defaultValue.flushCache();
    if (this.type) this.type.flushCache();
  }
 
  get isNameOnly(): boolean {
    return !this.defaultValue && !this.type;
  }
  
  // override
  equals(other?: JelNode): boolean {
		if (!(other instanceof TypedParameterDefinition))
			return false;
		return this.name == other.name && 
      (this.defaultValue === other.defaultValue || (!!this.defaultValue && this.defaultValue.equals(other.defaultValue))) &&
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

