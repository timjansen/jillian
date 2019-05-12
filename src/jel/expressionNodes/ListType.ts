import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import Assignment from './Assignment';
import JelObject from '../JelObject';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Runtime from '../Runtime';
import Callable from '../Callable';
import Context from '../Context';
import Util from '../../util/Util';
import SourcePosition from '../SourcePosition';

/**
 * Represents an list type. Returns a TypeDescriptor.
 *
 * Examples: 
 *  Float[]
 *  @Meter[]
 */
export default class ListType extends CachableJelNode {
  constructor(position: SourcePosition, public left: JelNode) {
    super(position, [left]);
  }
  
  // override
  executeUncached(ctx: Context): JelObject {
    return Util.resolveValue(this.left.execute(ctx), v=>BaseTypeRegistry.get('ListType').valueOf(v));
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
		return other instanceof ListType && this.left.equals(other.left);
	}

	toString(): string {
		return `(${this.left}[])`;
	}
}

