import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import TypedParameterDefinition from './TypedParameterDefinition';
import JelObject from '../JelObject';
import Callable from '../Callable';
import Context from '../Context';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Util from '../../util/Util';

/**
 * Represents a property definition in a class.
 */
export default class PropertyDef extends TypedParameterDefinition {
  constructor( name: string, type?: JelNode, defaultValue?: JelNode, public isNative = false) {
    super(name, defaultValue, type);
  }

  // override
  executeUncached(ctx: Context): JelObject|Promise<JelObject> {
    if (this.defaultValue || this.type)
      return Util.resolveValues((defaultValue: any, type: any)=>BaseTypeRegistry.get('Property').valueOf(this.name, defaultValue, type, this.isNative), this.defaultValue && this.defaultValue.execute(ctx), this.type && this.type.execute(ctx));
    else
      return BaseTypeRegistry.get('Property').valueOf(this.name, null, null, this.isNative);
  }
  
  isStaticUncached(ctx: Context): boolean {
    return (this.defaultValue ? this.defaultValue.isStatic(ctx) : true) &&
           (this.type ? this.type.isStatic(ctx) : true);
  }
  
  flushCache(): void {
    super.flushCache();
    if (this.defaultValue)
      this.defaultValue.flushCache();
    if (this.type)
      this.type.flushCache();
  }
 
  // override
  equals(other?: JelNode): boolean {
		if (!(other instanceof PropertyDef))
			return false;
		return this.name == other.name && this.isNative == other.isNative &&
      (this.defaultValue == other.defaultValue || (this.defaultValue!=null && other.defaultValue!=null && this.defaultValue.equals(other.defaultValue))) &&
      (this.type == other.type || (this.type!=null && other.type!=null && this.type.equals(other.type)));
	}
  	
	toString(): string {
		return `${this.isNative?'native ':''}${this.name}${this.type?': '+this.type.toString():''}${this.defaultValue ? ' = '+this.defaultValue.toString() : ''}`;
	}
}

