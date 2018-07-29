import JelNode from './JelNode';
import Context from '../Context';
import FuzzyBoolean from '../types/FuzzyBoolean';

/**
 * Represents a literal, atomic value (FuzzyBoolean, number, string, null).
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

	public value: any;
	constructor(value: any) {
    super();
		if (value === true || value === false)
			this.value = FuzzyBoolean.toFuzzyBoolean(value);
		else
			this.value = value;
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



