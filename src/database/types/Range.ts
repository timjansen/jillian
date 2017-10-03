import JelType from '../../jel/JelType';
import Fraction from './Fraction';
import UnitValue from './UnitValue';

/**
 * Represents a range of numeric values. Numbers can be primitive numbers of UnitValues. 
 * Ranges can be open-ended by passing a null for the min and/or max.
 */
export default class Range extends JelType {
	constructor(public min: number | Fraction | UnitValue | null, public max: number | Fraction | UnitValue | null) {
		super();
	}
	
	op(operator: string, right: any): any {
		if (right == null)
			return null;
		if (right instanceof Range) {
			if (operator == '==' || operator == '===')
				return JelType.op('==', this.min, right.min) && JelType.op('==', this.max, right.max);
		}
		// TODO
		return super.op(operator, right);
	}
	
	contains(right: any): boolean {
		return (this.min == null || JelType.op('<=', this.min, right)) &&
			(this.max == null || JelType.op('>=', this.max, right));
	}
						
	static withAccuracy(value: number, accuracy: number): Range {
		return new Range(value - accuracy, value + accuracy);
	}
	
	static create_jel_mapping = {min:0, max:1};
	static create(min: number | Fraction | UnitValue, max: number | Fraction | UnitValue): Range {
		return new Range(min, max);
	}
}


	