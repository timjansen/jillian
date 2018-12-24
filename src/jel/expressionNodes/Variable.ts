import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import Context from '../Context';
import JelObject from '../JelObject';


/**
 * Accesses a variable for reading.
 *
 * Examples:
 *   counter
 *   myValue
 */
export default class Variable extends CachableJelNode {
  
  constructor(public name: string) {
    super();
  }
  
  // override
  executeUncached(ctx: Context): JelObject|null|Promise<JelObject|null> {
    return ctx.get(this.name);
  }

  execute(ctx: Context): JelObject|null|Promise<JelObject|null> {
    return ctx.get(this.name);
  }

  
  isStaticUncached(ctx: Context): boolean {
    return ctx.hasInStaticScope(this.name);
  }
  
  flushCache(): void {
    super.flushCache();
  }
  
  // overrride
  equals(other?: JelNode): boolean {
		return other instanceof Variable &&
      this.name == other.name;
	}

	toString(): string {
		return this.name;
	}
  
  getSerializationProperties(): string[] {
    return [this.name];
  }
}
