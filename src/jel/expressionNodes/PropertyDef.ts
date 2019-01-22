import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import TypedParameterDefinition from './TypedParameterDefinition';
import JelObject from '../JelObject';
import LambdaExecutable from '../LambdaExecutable';
import Context from '../Context';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Util from '../../util/Util';

/**
 * Represents a property definition in a class.
 */
export default class PropertyDef extends CachableJelNode {
  constructor(public name: string, public type?: JelNode, public defaultValueGenerator?: JelNode, public isNative = false) {
    super();
  }

  // override
  executeUncached(ctx: Context): JelObject|Promise<JelObject> {
    return Util.resolveValue(this.type && this.type.execute(ctx), (type: any)=>BaseTypeRegistry.get('Property').valueOf(this.name, type, this.defaultValueGenerator ? new LambdaExecutable(this.defaultValueGenerator) : undefined, this.isNative), );
  }
  
  isStaticUncached(ctx: Context): boolean {
    return (this.defaultValueGenerator ? this.defaultValueGenerator.isStatic(ctx) : true) &&
           (this.type ? this.type.isStatic(ctx) : true);
  }
  
  flushCache(): void {
    super.flushCache();
    if (this.defaultValueGenerator)
      this.defaultValueGenerator.flushCache();
    if (this.type)
      this.type.flushCache();
  }
 
  // override
  equals(other?: JelNode): boolean {
		if (!(other instanceof PropertyDef))
			return false;
		return this.name == other.name && this.isNative == other.isNative &&
      (this.defaultValueGenerator == other.defaultValueGenerator || (this.defaultValueGenerator!=null && other.defaultValueGenerator!=null && this.defaultValueGenerator.equals(other.defaultValueGenerator))) &&
      (this.type == other.type || (this.type!=null && other.type!=null && this.type.equals(other.type)));
	}
  
	toString(): string {
		return `static ${this.isNative?'native ':''}${this.name}${this.type?': '+this.type.toString():''}${this.defaultValueGenerator ? ' = '+this.defaultValueGenerator.toString() : ''}`;
	}
}

