import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import Context from '../Context';
import BaseTypeRegistry from '../BaseTypeRegistry';
import JelObject from '../JelObject';


/**
 * Represents either an identifier or a class type.
 *
 * Examples:
 *   counter
 *   myValue
 */
export default class VariableOrType extends CachableJelNode {
  
  constructor(public name: string) {
    super();
  }
  
  // override
  executeUncached(ctx: Context): JelObject|null|Promise<JelObject|null> {
    try {
      const v = ctx.get(this.name);
      if (v instanceof Promise)
        return v.catch(()=>BaseTypeRegistry.get('SimpleType').valueOf(this.name));
      return v;
    }
    catch(e) {
      this.staticCache = true;
      return BaseTypeRegistry.get('SimpleType').valueOf(this.name);
    }
  }


  
  isStaticUncached(ctx: Context): boolean {
    return ctx.hasInStaticScope(this.name);
  }
  
  flushCache(): void {
    super.flushCache();
  }
  
  // overrride
  equals(other?: JelNode): boolean {
		return other instanceof VariableOrType &&
      this.name == other.name;
	}

	toString(): string {
		return this.name;
	}
}
