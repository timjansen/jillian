import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import TypedParameterDefinition from './TypedParameterDefinition';
import JelObject from '../JelObject';
import Callable from '../Callable';
import Context from '../Context';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Util from '../../util/Util';

/**
 * Represents a static property definition in a class.
 */
export default class StaticPropertyDef extends CachableJelNode {
  constructor(public name: string, public type?: JelNode, public callable?: JelNode, public isNative = false) {
    super();
  }

  // override
  executeUncached(ctx: Context): JelObject|Promise<JelObject> {
    return Util.resolveValues((callable: any, type: any)=>BaseTypeRegistry.get('StaticProperty').valueOf(this.name, type, callable, this.isNative), this.callable && this.callable.execute(ctx), this.type && this.type.execute(ctx));
  }
  
  isStaticUncached(ctx: Context): boolean {
    return (this.callable ? this.callable.isStatic(ctx) : true) &&
           (this.type ? this.type.isStatic(ctx) : true);
  }
  
  flushCache(): void {
    super.flushCache();
    if (this.callable)
      this.callable.flushCache();
    if (this.type)
      this.type.flushCache();
  }
 
  // override
  equals(other?: JelNode): boolean {
		if (!(other instanceof StaticPropertyDef))
			return false;
		return this.name == other.name && this.isNative == other.isNative &&
      (this.callable == other.callable || (this.callable!=null && other.callable!=null && this.callable.equals(other.callable))) &&
      (this.type == other.type || (this.type!=null && other.type!=null && this.type.equals(other.type)));
	}
  
	toString(): string {
		return `static ${this.isNative?'native ':''}${this.name}${this.type?': '+this.type.toString():''}${this.callable ? ' = '+this.callable.toString() : ''}`;
	}
}

