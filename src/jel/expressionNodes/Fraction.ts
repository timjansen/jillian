import JelNode from './JelNode';
import Context from '../Context';
import JelFraction from '../types/Fraction';

/**
 * Represents a Fraction literal.
 *
 * Examples:
 *   1/2
 *   1  /  3
 *   454/23
 */
export default class Fraction extends JelNode {

	value: JelFraction;
	
	constructor(a: number, b: number) {
    super();
		this.value = new JelFraction(a, b);
  }

  // override
  execute(ctx: Context): JelFraction {
    return this.value;
  }
  
  // override
  equals(other?: JelNode): boolean {
		return other instanceof Fraction && this.value.equals(other.value);
	}
  
	toString(): string {
		return JSON.stringify(this.value.numerator) + '/' + JSON.stringify(this.value.denominator);
	}  
	
  getSerializationProperties(): any[] {
    return [this.value.numerator, this.value.denominator];
  }
}



