import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import JelObject from '../JelObject';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Context from '../Context';
import Util from '../../util/Util';
import SourcePosition from '../SourcePosition';

/**
 * Represents an optional value (aka type). Returns a TypeDescriptor.
 *
 * Examples: 
 *  Float?
 *  string?
 */
export default class Optional extends CachableJelNode {
  constructor(position: SourcePosition, public left: JelNode) {
    super(position, [left]);
  }
  
  // override
  executeUncached(ctx: Context): JelObject {
    return Util.resolveValue(this.left.execute(ctx), v=>BaseTypeRegistry.get('OptionalType').valueOf(v));
  }
  
  isStaticUncached(ctx: Context) {
    return this.left.isStatic(ctx);
  }
  
  flushCache(): void {
    super.flushCache();
    this.left.flushCache();
  }
  
  // overrride
  equals(other?: JelNode): boolean {
		return other instanceof Optional && this.left.equals(other.left);
	}

	toString(): string {
		return `(${this.left.toString()}?)`;
	}

}

