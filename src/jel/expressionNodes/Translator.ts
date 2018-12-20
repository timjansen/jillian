import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import PatternAssignment from './PatternAssignment';
import JelObject from '../JelObject';
import Context from '../Context';
import BaseTypeRegistry from '../BaseTypeRegistry';

/**
 * Represents a translator that maps Patterns onto expressions, with optional meta values.
 * 
 * Examples:
 *  {{`one` => 1, `two` => 2}}
 *	{{verb: `walk` => Walking(), 
 *	  verb, tense="past": `walked`: Walking(past=true), 
 *		verb: `run` => Running()}}
 */
export default class Translator extends CachableJelNode {
  constructor(public elements: PatternAssignment[] = []) {
    super();
  }

  // override
  executeUncached(ctx: Context): JelObject {
    const t = BaseTypeRegistry.get('Translator').create();
    this.elements.forEach(e=>t.addPattern(e.name, e.expression, e.getMetaData(ctx)));
    return t;
  }
  
  isStaticUncached(ctx: Context): boolean {
    return !this.elements.find(e=>!e.isStatic(ctx));
  }
  
  flushCache(): void {
    super.flushCache();
    this.elements.forEach(a=>a.flushCache());
  }
  
  // override
  equals(other?: JelNode): boolean {
		return other instanceof Translator &&
      this.elements.length == other.elements.length && 
      !this.elements.find((l, i)=>!l.equals(other.elements[i]));
	}

  toString(): string {
		return `Translator(${this.elements.map(s=>s.toString()).join(', ')})`;	
	}
	
  getSerializationProperties(): any[] {
    return [this.elements];
  }
}

