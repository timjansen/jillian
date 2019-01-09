import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import Variable from './Variable';
import BaseTypeRegistry from '../BaseTypeRegistry';
import JelObject from '../JelObject';
import Runtime from '../Runtime';
import Context from '../Context';
import Util from '../../util/Util';

/**
 * Represents a range operator (...). 
 *
 * Examples:
 *  3...19
 *	1/3...2/3
 * 
 */ 
export default class Range extends CachableJelNode {
  private range: any;
  
  constructor(public left: JelNode, public right: JelNode) {
    super();
    this.range = BaseTypeRegistry.get('Range');
  }

  // override
  executeUncached(ctx: Context): JelObject|null|Promise<JelObject|null> {
    return Util.resolveValues((l: any,r: any)=>this.range.valueOf(l, r), this.left.execute(ctx), this.right.execute(ctx));
  }

  isStaticUncached(ctx: Context): boolean {
    return this.left.isStatic(ctx) && this.right.isStatic(ctx);
  }
  
  flushCache(): void {
    super.flushCache();
    this.left.flushCache();
    this.right.flushCache();
  }
  
  // overrride
  equals(other?: JelNode): boolean {
		return other instanceof Range &&
      this.left.equals(other.left) &&
      this.right.equals(other.right);
	}
  
	toString(): string {
  	return `(${this.left.toString()}...${this.right.toString()})`;
	}
	
  getSerializationProperties(): Object {
    return [this.left, this.right];
  }
}

