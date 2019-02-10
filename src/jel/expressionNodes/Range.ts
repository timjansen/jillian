import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import Variable from './Variable';
import BaseTypeRegistry from '../BaseTypeRegistry';
import JelObject from '../JelObject';
import Runtime from '../Runtime';
import Context from '../Context';
import Util from '../../util/Util';
import SourcePosition from '../SourcePosition';

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
  
  constructor(position: SourcePosition, public left: JelNode|undefined, public right: JelNode|undefined, public minExclusive: boolean = false, public maxExclusive: boolean = false) {
    super(position);
    this.range = BaseTypeRegistry.get('Range');
  }

  // override
  executeUncached(ctx: Context): JelObject|null|Promise<JelObject|null> {
    if (this.left) {
      if (this.right)
        return Util.resolveValues((l: any,r: any)=>this.range.valueOf(l, r, this.minExclusive, this.maxExclusive), this.left.execute(ctx), this.right.execute(ctx));
      else
        return Util.resolveValue(this.left.execute(ctx), (l: any)=>this.range.valueOf(l, null, this.minExclusive, this.maxExclusive));
    }
    else if (this.right)
        return Util.resolveValue(this.right.execute(ctx), (r: any)=>this.range.valueOf(null, r, this.minExclusive, this.maxExclusive));
    else
      return this.range.valueOf(null, null);
  }

  isStaticUncached(ctx: Context): boolean {
    return (this.left == null || this.left.isStatic(ctx)) && (this.right == null || this.right.isStatic(ctx));
  }
  
  flushCache(): void {
    super.flushCache();
    if (this.left) this.left.flushCache();
    if (this.right) this.right.flushCache();
  }
  
  // overrride
  equals(other?: JelNode): boolean {
		return other instanceof Range &&
      (this.minExclusive == other.minExclusive) &&
      (this.maxExclusive == other.maxExclusive) &&
      (this.left  ? this.left.equals(other.left) : other.left == null) &&
      (this.right  ? this.right.equals(other.right) : other.right == null);
	}
  
	toString(): string {
    if (this.left) {
      if (this.right)
      	return `(${this.minExclusive?'>':''}${this.left.toString()}...${this.maxExclusive?'<':''}${this.right.toString()})`;
      else
      	return this.minExclusive ? `(>${this.left.toString()})` : `(>=${this.left.toString()})`;
    }
    else if (this.right)
     	return this.maxExclusive ? `(<${this.right.toString()})` : `(<=${this.right.toString()})`;
    else
      return "(null...null)";
	}

}

