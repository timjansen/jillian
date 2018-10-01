import JelNode from './JelNode';
import JelType from '../JelType';
import Context from '../Context';
import JelList from '../types/List';
import Util from '../../util/Util';

/**
 * Represents a List literal, like in JavaScript.
 *
 * Examples:
 *	[]              // empty lists
 *	[1,2,3] 
 *	[a-1, a, a+1]   // expression to create list elements
 */
export default class List extends JelNode {
  constructor(public elements: JelNode[]) {
    super();
  }

  // override
  execute(ctx: Context): JelList { 
    return Util.resolveArray(this.elements.map(e=>e.execute(ctx)), (l: any[])=>new JelList(l));
  }
  
  // override
  equals(other?: JelNode): boolean {
		return other instanceof List &&
      this.elements.length == other.elements.length && 
      !this.elements.find((l, i)=>!l.equals(other.elements[i]));
	}

  toString(): string {
		return `[${this.elements.map(s=>s.toString()).join(', ')}]`;
	}  
	
  getSerializationProperties(): any[] {
    return [this.elements];
  }
}
