import JelNode from './JelNode';
import Context from '../Context';
import JelObject from '../JelObject';
import BaseTypeRegistry from '../BaseTypeRegistry';

/**
 * Represents a Fraction literal.
 *
 * Examples:
 *   1/2
 *   1  /  3
 *   454/23
 */
export default class Fraction extends JelNode {

	value: any;
	
	constructor(a: number, b: number) {
    super();
		this.value = BaseTypeRegistry.get('Fraction').valueOf(a, b);
  }

  // override
  execute(ctx: Context): JelObject {
    return this.value;
  }
  
  isStatic(): boolean {
    return true;
  }
  
    
  flushCache(): void {
  }
  
  // override
  equals(other?: JelNode): boolean {
		return other instanceof BaseTypeRegistry.get('Fraction') && this.value.equals((other as any).value);
	}
  
	toString(): string {
		return `(${JSON.stringify(this.value.numerator)}/${JSON.stringify(this.value.denominator)})`;
	}  
}



