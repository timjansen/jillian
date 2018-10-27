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
  execute(ctx: Context): JelUnitValue | Promise<JelUnitValue> {
		if (!this.cached) {
			const left: any = this.value.execute(ctx);
			if (left instanceof Promise)
				return left as any;
			this.cached = new JelUnitValue(left, this.unit);
		}
    return this.cached as JelUnitValue;
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



