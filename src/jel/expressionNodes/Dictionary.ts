import JelNode from './JelNode';
import Assignment from './Assignment';
import JelType from '../JelType';
import Context from '../Context';
import Util from '../../util/Util';
import JelDictionary from '../types/Dictionary';

/**
 * A key/value map literal.
 *
 * Examples: 
 *	{}                            // empty dictionary
 *  {a: 2, b: "bar", c: 4*5}      // keys following identifier logic do not need to be quoted. Values can be expressions.
 *	{"a": 2, 'b': 4, 77: "foo"}   // all literals can be keys
 *	{true: 1, false: 0}           // boolean values as keys
 *  {a}                           // short-cut for {a: a} . Reads the variable "a" and stores it as "a".
 *	{a, b: 2, c}
 */
export default class Dictionary extends JelNode {
  constructor(public elements: Assignment[] = []) {
    super();
  }

  // override
  execute(ctx: Context): any {
    const map = new Map();
		const promises: Promise<any>[] = [];
    this.elements.forEach(a => {
			const value = a.execute(ctx);
			if (value instanceof Promise)
				promises.push(value.then(v=>map.set(a.name, v)));
			else
				map.set(a.name, value);
		});
		
		if (promises.length)
			return Promise.all(promises).then(()=>new JelDictionary(map, true));
		else
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

