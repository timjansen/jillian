import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import JelObject from '../JelObject';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Context from '../Context';
import Util from '../../util/Util';
import SourcePosition from '../SourcePosition';

/**
 * Represents an dictionary type. Returns a TypeDescriptor.
 *
 * Examples: 
 *  Float{}
 *  @Meter{}
 */
export default class DictType extends CachableJelNode {
  constructor(position: SourcePosition, public left: JelNode) {
    super(position);
  }
  
  // override
  executeUncached(ctx: Context): JelObject {
    return Util.resolveValue(this.left.execute(ctx), v=>BaseTypeRegistry.get('DictionaryType').valueOf(v));
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
		return other instanceof DictType && this.left.equals(other.left);
	}

	toString(): string {
		return `(${this.left}{})`;
	}
}

