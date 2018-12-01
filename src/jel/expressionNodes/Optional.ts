import JelNode from './JelNode';
import Assignment from './Assignment';
import JelObject from '../JelObject';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Runtime from '../Runtime';
import Callable from '../Callable';
import Context from '../Context';
import Util from '../../util/Util';

/**
 * Represents an optional value (aka type). Returns a TypeDescriptor.
 *
 * Examples: 
 *  Number?
 *  @Meter?
 */
export default class Optional extends JelNode {
  constructor(public left: JelNode) {
    super();
  }
  
  // override
  execute(ctx: Context): JelObject {
    return Util.resolveValue(this.left.execute(ctx), v=>BaseTypeRegistry.get('OptionalType').valueOf(v));
  }
  
  // overrride
  equals(other?: JelNode): boolean {
		return other instanceof Optional && this.left.equals(other.left);
	}

	toString(): string {
		return `${this.left}?`;
	}
  
  getSerializationProperties(): any {
    return [this.left];
  }
}

