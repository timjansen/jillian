import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import Context from '../Context';
import JelObject from '../JelObject';
import SourcePosition from '../SourcePosition';


/**
 * Accesses a variable for reading.
 *
 * Examples:
 *   counter
 *   myValue
 */
export default class Variable extends CachableJelNode {
  
  constructor(position: SourcePosition, public name: string) {
    super(position);
  }
  
  // override
  executeUncached(ctx: Context): JelObject|null|Promise<JelObject|null> {
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
}
