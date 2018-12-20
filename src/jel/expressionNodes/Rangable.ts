import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import JelObject from '../JelObject';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Callable from '../Callable';
import Context from '../Context';
import Util from '../../util/Util';

/**
 * Represents an rangable value (aka type). Returns a TypeDescriptor.
 *
 * Examples: 
 *  Float~
 *  number~
 */
export default class Rangable extends CachableJelNode {
  constructor(public left: JelNode) {
    super();
  }
  
  executeUncached(ctx: Context): JelObject {
    return Util.resolveValue(this.left.execute(ctx), v=>BaseTypeRegistry.get('RangableType').valueOf(v));
  }
  
  isStaticUncached(ctx: Context): boolean {
    return this.left.isStatic(ctx);
  }
  
  flushCache(): void {
    super.flushCache();
    this.left.flushCache();
  }
  
  // overrride
  equals(other?: JelNode): boolean {
		return other instanceof Rangable && this.left.equals(other.left);
	}

	toString(): string {
		return `${this.left}~`;
	}
  
  getSerializationProperties(): any {
    return [this.left];
  }
}

