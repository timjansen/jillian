import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import JelObject from '../JelObject';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Context from '../Context';
import Util from '../../util/Util';
import SourcePosition from '../SourcePosition';

/**
 * Represents an set of type requirements. Returns an AndType.
 *
 * Examples: 
 *  number&^int
 * 
 */
export default class ReqTypes extends CachableJelNode {
  constructor(position: SourcePosition, public requirements: JelNode[]) {
    super(position, requirements);
  }
  
  // override
  executeUncached(ctx: Context): JelObject {
    return Util.resolveArray(this.requirements.map(o=>o.execute(ctx)), v=>BaseTypeRegistry.get('AndType').valueOf(v));
  }
  
  isStaticUncached(ctx: Context) {
    return !this.requirements.find(o=>!o.isStatic(ctx));
  }
  
  flushCache(): void {
    super.flushCache();
    this.requirements.forEach(a=>a.flushCache());
  }
  
  // overrride
  equals(other?: JelNode): boolean {
		return other instanceof ReqTypes && 
      this.requirements.length == other.requirements.length && 
      !this.requirements.find((l, i)=>!l.equals(other.requirements[i]));
	}
  
	toString(): string {
		return '('+this.requirements.map(o=>o.toString()).join('&')+')';
	}

}


