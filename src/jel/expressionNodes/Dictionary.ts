import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import Assignment from './Assignment';
import DynamicAssignment from './DynamicAssignment';
import JelObject from '../JelObject';
import Context from '../Context';
import Util from '../../util/Util';
import BaseTypeRegistry from '../BaseTypeRegistry';
import SourcePosition from '../SourcePosition';


/**
 * A key/value map literal.
 *
 * Examples: 
 *	{}                            // empty dictionary
 *  {a: 2, b: "bar", c: 4*5}      // keys following identifier logic do not need to be quoted. Values can be expressions.
 *	{"a": 2, 'b': 4}              // all string literals can be keys
 *	{'b{count}': 4}               // string templates are supported
 *	{true: 1, false: 0}           // boolean values as keys
 *  {a}                           // short-cut for {a: a} . Reads the variable "a" and stores it as "a".
 *	{a, b: 2, c}
 */
export default class Dictionary extends CachableJelNode {
  private dictionary: any;
  constructor(token: SourcePosition, public elements: Assignment[] = [], public dynamicElements: DynamicAssignment[] = []) {
    super(token);
    this.dictionary = BaseTypeRegistry.get('Dictionary');
  }

  mergeMaps(maps: Map<string, JelObject|null>[]): any {
    const m = maps[0];
    for (let i = 1; i < maps.length; i++)
      maps[i].forEach((v: any, k: any)=>m.set(k,v));
    return this.dictionary.valueOf(m, true);
  }
  
  executeDynamic(ctx: Context, map: Map<string, JelObject|null>): JelObject|null|Promise<JelObject|null> {
    if (!this.dynamicElements.length)
      return this.dictionary.valueOf(map, true);

    const promises: Promise<any>[] = [];
    const results: Map<string, JelObject|null>[] = [map];

    for (let i = 0; i < this.dynamicElements.length; i++) {
      const dictValue = this.dynamicElements[i].execute(ctx) as any;
      if (dictValue instanceof Promise)
        promises.push(dictValue.then((v: any)=>{results[i+1] = v.elements;}));
      else
        results[i+1] = dictValue.elements;
    }

    if (promises.length)
      return Promise.all(promises).then(()=>this.mergeMaps(results));
    else
      return this.mergeMaps(results);
  }

  
  executeUncached(ctx: Context): JelObject|null|Promise<JelObject|null> {
    if (!this.elements.length && !this.dynamicElements.length)
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
			return Promise.all(promises).then(()=>this.executeDynamic(ctx, map));
		else
	    return this.executeDynamic(ctx, map);
  }
  
  isStaticUncached(ctx: Context): boolean {
    let s = true;
    this.elements.forEach(a => {
      s = s && a.isStatic(ctx);
		});
    this.dynamicElements.forEach(a => {
      s = s && a.isStatic(ctx);
		});
    return s;    
  }
  
  flushCache(): void {
    super.flushCache();
    this.elements.forEach(e=>e.flushCache());
    this.dynamicElements.forEach(e=>e.flushCache());
  }
  
  // override
  equals(other?: JelNode): boolean {
		return other instanceof Dictionary &&
      this.elements.length == (other as any).elements.length && 
      !this.elements.find((l, i)=>!l.equals((other as any).elements[i])) &&
      this.dynamicElements.length == (other as any).dynamicElements.length && 
      !this.dynamicElements.find((l, i)=>!l.equals((other as any).dynamicElements[i]));
	}

  toString(): string {
		return `{${this.elements.concat(this.dynamicElements as any).map((s: any)=>s.toString(': ')).join(', ')}}`;
	}

}

