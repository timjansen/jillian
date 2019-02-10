import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import JelObject from '../JelObject';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Context from '../Context';
import Util from '../../util/Util';
import SourcePosition from '../SourcePosition';

/**
 * Represents an set of type options. Returns a OptionType.
 *
 * Examples: 
 *  Float|String
 *  @Length|@Size|null
 */
export default class Options extends CachableJelNode {
  constructor(position: SourcePosition, public options: JelNode[]) {
    super(position);
  }
  
  // override
  executeUncached(ctx: Context): JelObject {
    return Util.resolveArray(this.options.map(o=>o.execute(ctx)), v=>BaseTypeRegistry.get('OptionType').valueOf(v));
  }
  
  isStaticUncached(ctx: Context) {
    return !this.options.find(o=>!o.isStatic(ctx));
  }
  
  flushCache(): void {
    super.flushCache();
    this.options.forEach(a=>a.flushCache());
  }
  
  // overrride
  equals(other?: JelNode): boolean {
		return other instanceof Options && 
      this.options.length == other.options.length && 
      !this.options.find((l, i)=>!l.equals(other.options[i]));
	}
  
	toString(): string {
		return '('+this.options.map(o=>o.toString()).join('|')+')';
	}

}


