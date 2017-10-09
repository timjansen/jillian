import JelNode from './JelNode';
import Assignment from './Assignment';
import JelType from '../JelType';
import Context from '../Context';
import Util from '../../util/Util';
import JelDictionary from '../Dictionary';

export default class Dictionary extends JelNode {
  constructor(public elements: Assignment[] = []) {
    super();
  }

  // override
  execute(ctx: Context): any {
    const map = new Map();
    this.elements.forEach(a => map.set(a.name, a.execute(ctx)));
    return new JelDictionary(map, true);
  }
  
  // override
  equals(other?: JelNode): boolean {
		return other instanceof Dictionary &&
      this.elements.length == other.elements.length && 
      !this.elements.find((l, i)=>!l.equals(other.elements[i]));
	}

  toString(): string {
		return `{${this.elements.map(s=>s.toString(': ')).join(', ')}}`;
	}
	
  getSerializationProperties(): any[] {
    return [this.elements];
  }
}

