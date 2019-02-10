import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import Context from '../Context';
import JelObject from '../JelObject';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Util from '../../util/Util';
import SourcePosition from '../SourcePosition';

/**
 * Represents a List literal, like in JavaScript.
 *
 * Examples:
 *	[]              // empty lists
 *	[1,2,3] 
 *	[a-1, a, a+1]   // expression to create list elements
 */
export default class List extends CachableJelNode {
  private list: any;

  constructor(position: SourcePosition, public elements: JelNode[]) {
    super(position);
    this.list = BaseTypeRegistry.get('List');
  }

  // override
  executeUncached(ctx: Context): JelObject { 
    if (!this.elements.length)
      return this.list.empty;
    return Util.resolveArray(this.elements.map(e=>e.execute(ctx)), (l: any[])=>this.list.valueOf(l));
  }
  
  isStaticUncached(ctx: Context): boolean {
    for (let e of this.elements)
      if (!e.isStatic(ctx))
        return false;
    return true;
  }
  
  flushCache(): void {
    super.flushCache();
    this.elements.forEach(a=>a.flushCache());
  }

  // override
  equals(other?: JelNode): boolean {
		return other instanceof this.list &&
      this.elements.length == (other as any).elements.length && 
      !this.elements.find((l, i)=>!l.equals((other as any).elements[i]));
	}

  toString(): string {
		return `[${this.elements.map(s=>s.toString()).join(', ')}]`;
	}  

}
