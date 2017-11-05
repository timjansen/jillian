import JelNode from './JelNode';
import JelType from '../JelType';
import Context from '../Context';
import JelList from '../types/List';
import Util from '../../util/Util';

export default class List extends JelNode {
  constructor(public elements: JelNode[]) {
    super();
  }

  // override
  execute(ctx: Context): JelList { 
    return new JelList(this.elements.map(e=>e.execute(ctx)));
  }
  
  // override
  equals(other?: JelNode): boolean {
		return other instanceof List &&
      this.elements.length == other.elements.length && 
      !this.elements.find((l, i)=>!l.equals(other.elements[i]));
	}

  toString(): string {
		return `{${this.elements.map(s=>s.toString()).join(', ')}}`;
	}  
	
  getSerializationProperties(): any[] {
    return [this.elements];
  }
}
