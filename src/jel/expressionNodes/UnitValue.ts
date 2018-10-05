import JelNode from './JelNode';
import Context from '../Context';
import JelFraction from '../types/Fraction';
import JelUnitValue from '../types/UnitValue';

/**
 * Represents a Unit Value
 *
 * Examples:
 *   3 @Meter
 *   3/4 @Inch
 */
export default class UnitValue extends JelNode {
	private cached: JelUnitValue | undefined;	
	
	constructor(public value: JelNode, public unit: string) {
    super();
  }

  // override
  execute(ctx: Context): any {
		if (!this.cached) 
			this.cached = new JelUnitValue(this.value.execute(ctx), this.unit);
    return this.cached;
  }
  
  // override
  equals(other?: JelNode): boolean {
		return other instanceof UnitValue && this.value.equals(other.value) && this.unit == other.unit;
	}
  
	toString(): string {
		return this.value.toString() + ' @' + this.unit;
	}  
	
  getSerializationProperties(): any[] {
    return [this.value, this.unit];
  }
}



