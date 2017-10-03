import JelNode from './JelNode';
import JelPattern from '../Pattern';
import Pattern from './Pattern';
import Assignment from './Assignment';
import JelType from '../JelType';
import Context from '../Context';
import Serializable from '../Serializable';

const EMPTY_MAP = new Map();

export default class PatternAssignment extends JelNode implements Serializable {
  constructor(public name: JelPattern, public expression: JelNode, public meta: Assignment[]) {
    super();
  }

  // override
  execute(ctx: Context): any {
  	return this.expression.execute(ctx);
  }
 
	getMetaData(ctx: Context): Map<string, any> {
		if (!this.meta)
			return EMPTY_MAP;
		
		const m = new Map();
		this.meta.forEach(e=>m.set(e.name, e.execute(ctx)));
		return m;
	}
	
  // override
  equals(other: JelNode): boolean {
		if (!(other instanceof PatternAssignment))
			return false;
		if (this.meta) {
			if ((!this.meta) != (!other.meta))
				return false;
			if (this.meta.length != other.meta.length)
				return false;
			
			for (let i = 0; i < this.meta.length; i++)
				if (!this.meta[i].equals(other.meta[i]))
					return false;
		}
		return this.name.equals(other.name) && this.expression.equals(other.expression);
	}
  
  getSerializationProperties(): Object {
    return {name: this.name, expression: this.expression, meta: this.meta};
  }
	
	toString(separator='='): string {
		const meta = this.meta ? `${this.meta.map(s=>s.toString()).join(', ')}: ` : '';
		return `${meta}${this.name}${separator}${this.expression.toString()}`;
	}
}

