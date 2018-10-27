import JelNode from './JelNode';
import Context from '../Context';
import JelObject from '../JelObject';


/**
 * Accesses a variable for reading.
 *
 * Examples:
 *   counter
 *   myValue
 */
export default class Variable extends JelNode {
  constructor(public name: string) {
    super();
  }
  
  // override
  execute(ctx: Context): JelObject|null|Promise<JelObject|null> {
    return ctx.get(this.name);
  }
  
  // overrride
  equals(other?: JelNode): boolean {
		return other instanceof Variable &&
      this.name == other.name;
	}

	toString(): string {
		return this.name;
	}
  
  getSerializationProperties(): string[] {
    return [this.name];
  }
}
