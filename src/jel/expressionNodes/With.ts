import JelNode from './JelNode';
import Assignment from './Assignment';
import Context from '../Context';

export default class With extends JelNode {
  constructor(public assignments: Assignment[], public expression: JelNode) {
    super();
  }
  
  // override
  execute(ctx:Context): any {
    const newCtx = new Context(ctx);
    this.assignments.forEach(a => newCtx.set(a.name, a.execute(newCtx)));
		newCtx.freeze();
    return this.expression.execute(newCtx);
  }

  // override
  equals(other?: JelNode): boolean {
		return (other instanceof With) &&
			this.expression.equals(other.expression) && 
      this.assignments.length == other.assignments.length && 
      !this.assignments.find((l, i)=>!l.equals(other.assignments[i]));
	}
  
	toString(): string {
		return `with ${this.assignments.map(s=>s.toString()).join(', ')}): ${this.expression.toString()}`;		
	}
	
  getSerializationProperties(): Object {
    return {assignments: this.assignments, expression: this.expression};
  }
}

