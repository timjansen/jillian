import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import Assignment from './Assignment';
import JelObject from '../JelObject';
import Context from '../Context';
import Util from '../../util/Util';
import BaseTypeRegistry from '../BaseTypeRegistry';


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
export default class Dictionary extends CachableJelNode {
  private dictionary: any;
  constructor(public elements: Assignment[] = []) {
    super();
    this.dictionary = BaseTypeRegistry.get('Dictionary');
  }

  executeUncached(ctx: Context): JelObject|null|Promise<JelObject|null> {
    if (this.elements.length == 0)
      return this.dictionary.empty;
    
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
			return Promise.all(promises).then(()=>this.dictionary.valueOf(map, true));
		else
	    return this.dictionary.valueOf(map, true);
  }
  
  isStaticUncached(ctx: Context): boolean {
    let s = true;
    this.elements.forEach(a => {
      s = s && a.isStatic(ctx);
		});
    return s;    
  }
  
  flushCache(): void {
    super.flushCache();
    this.elements.forEach(e=>e.flushCache());
  }
  
  // override
  equals(other?: JelNode): boolean {
		return other instanceof this.dictionary &&
      this.elements.length == (other as any).elements.length && 
      !this.elements.find((l, i)=>!l.equals((other as any).elements[i]));
	}

  toString(): string {
		return `{${this.elements.map(s=>s.toString(': ')).join(', ')}}`;
	}
	
  getSerializationProperties(): any[] {
    return [this.elements];
  }
}

