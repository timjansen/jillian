import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import Assignment from './Assignment';
import Context from '../Context';
import JelObject from '../JelObject';


/**
 * Defines one or more constants in its execution scope.
 * 
 * Examples:
 *   let a=2: a+3   // returns 5
 *   let x=1, y=x+2, z=y*3: z*4   // returns 36
 */
export default class Let extends CachableJelNode {
  constructor(public assignments: Assignment[], public expression: JelNode) {
    super();
  }
  
  // override
  executeUncached(ctx:Context): JelObject|null|Promise<JelObject|null> {
    const newCtx = new Context(ctx);
    let isStatic = true;
    this.assignments.forEach(a => {
      newCtx.set(a.name, a.execute(newCtx));
      isStatic = isStatic && a.isStatic(ctx);
    });
		newCtx.freeze(isStatic);
    return this.expression.execute(newCtx);
  }
  
  isStaticUncached(ctx: Context): boolean {
    return this.expression.isStatic(ctx) && !this.assignments.find(a=>!a.isStatic(ctx));
  }

  flushCache(): void {
    super.flushCache();
    this.expression.flushCache();
    this.assignments.forEach(a=>a.flushCache());
  }
  
  // override
  equals(other?: JelNode): boolean {
		return (other instanceof Let) &&
			this.expression.equals(other.expression) && 
      this.assignments.length == other.assignments.length && 
      !this.assignments.find((l, i)=>!l.equals(other.assignments[i]));
	}
  
	toString(): string {
		return `let ${this.assignments.map(s=>s.toString()).join(', ')}: ${this.expression.toString()}`;		
	}
	
  getSerializationProperties(): Object {
    return [this.assignments, this.expression];
  }
}

