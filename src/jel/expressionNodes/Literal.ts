import JelNode from './JelNode';
import Context from '../Context';

/**
 * Represents a literal, atomic value (boolean, number, string, null).
 *
 * Examples:
 *   null
 *   true
 *   false
 *   1
 *   -1
 *   2.54
 *	 10.43e-23
 *   "foo"
 *	 'bar'
 *	 "it said \"boo\""
 *	 'it said "boo"'
 *	 "Here are some indented lines:\n\tLine1\n\tLine2\n"
 */
export default class Literal extends JelNode {
  static TRUE = new Literal(true);
	
	constructor(public value: any) {
    super();
  }

  // override
  execute(ctx: Context): any {
    return this.value;
  }
  
  // override
  equals(other?: JelNode): boolean {
		return other instanceof Literal &&
      this.value == other.value;
	}
  
	toString(): string {
		return JSON.stringify(this.value);
	}  
	
  getSerializationProperties(): any[] {
    return [this.value];
  }
}



