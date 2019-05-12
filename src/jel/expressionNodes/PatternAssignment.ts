import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import Pattern from './Pattern';
import Assignment from './Assignment';
import JelObject from '../JelObject';
import Context from '../Context';
import Serializable from '../Serializable';
import BaseTypeRegistry from '../BaseTypeRegistry';
import SourcePosition from '../SourcePosition';



/**
 * Helper class used by Translators to define the translator's elements. Each assignment consists of a Pattern, an expression and 
 * optional meta values.
 */
export default class PatternAssignment extends CachableJelNode {
  constructor(position: SourcePosition, public name: any, public expression: JelNode, public meta: Assignment[]|undefined) {
    super(position, meta ? (meta as JelNode[]).concat(expression) : [expression]);
  }

  // override
  executeUncached(ctx: Context): JelObject|null|Promise<JelObject|null> {
  	return this.expression.execute(ctx);
  }
  
  isStaticUncached(ctx: Context): boolean {
    return this.expression.isStatic(ctx) && (!this.meta || !this.meta.find(m=>!m.isStatic(ctx)));
  }
 
  flushCache(): void {
    super.flushCache();
    this.expression.flushCache();
    if (this.meta)  
      this.meta.forEach(a=>a.flushCache());
  }
  
	getMetaData(ctx: Context): any { // returns Dictionary
		if (!this.meta)
			return BaseTypeRegistry.get('Dictionary').empty;
		
		const m = new Map();
		this.meta.forEach(e=>m.set(e.name, e.execute(ctx)));
		return BaseTypeRegistry.get('Dictionary').valueOf(m, true);
	}
	
  // override
  equals(other?: JelNode): boolean {
		if (!(other instanceof PatternAssignment))
			return false;
		if (this.meta) {
			if (!other.meta)
				return false;
			if (this.meta.length != other.meta.length)
				return false;
			
			for (let i = 0; i < this.meta.length; i++)
				if (!this.meta[i].equals(other.meta[i]))
					return false;
		}
		return this.name.equals(other.name) && this.expression.equals(other.expression);
	}
	
	toString(separator='='): string {
		const meta = this.meta ? `${this.meta.map(s=>s.toString()).join(', ')}: ` : '';
		return `${meta}${this.name}${separator}${this.expression.toString()}`;
	}
}

