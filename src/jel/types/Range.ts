import JelType from '../JelType';
import Fraction from './Fraction';
import UnitValue from './UnitValue';
import ApproximateNumber from './ApproximateNumber';
import FuzzyBoolean from './FuzzyBoolean';

const RANGE_NUM_OPS: any = {'+': true, '-': true, '*': true, '/': true};

/**
 * Represents a range of numeric values. Numbers can be primitive numbers of UnitValues. 
 * Ranges can be open-ended by passing a null for the min and/or max.
 */
export default class Range extends JelType {
	
	constructor(public min?: number | Fraction | UnitValue | ApproximateNumber | null, public max?: number | Fraction | UnitValue | ApproximateNumber | null) {
		super();
		
		if (JelType.op('>', min, max).toRealBoolean()) {
			this.max = min;
			this.min = max;
		}
	}
	
	op(operator: string, right: any): any {
		if (operator == '!==')
			return this.op('===', right).negate();
		else if (operator == '!=')
			return this.op('==', right).negate();
		else if (right instanceof Range) {
			if (operator == '==')
				return this.contains(right.min).or(this.contains(right.max)).or(right.contains(this.min)).or(right.contains(this.max));
			else if (operator == '===')
				return JelType.op('===', this.min, right.min).and(JelType.op('===', this.max, right.max));
			else if (operator == '>>')
				return (right.max == null || this.min == null) ? FuzzyBoolean.CLEARLY_FALSE : JelType.op('>>', this.min, right.max);
			else if (operator == '<<')
				return (right.min == null || this.max == null) ? FuzzyBoolean.CLEARLY_FALSE : JelType.op('<<', this.max, right.min);
			else if (operator == '>')
				return (this.max == null || right.max == null) ? FuzzyBoolean.toFuzzyBoolean(this.max == null && right.max != null) : JelType.op('>', this.max, right.max);
			else if (operator == '<')
				return (this.min == null || right.min == null) ? FuzzyBoolean.toFuzzyBoolean(this.min == null && right.min != null) : JelType.op('<', this.min, right.min);
			else if (operator == '>>=')
				return (this.min == null || right.max == null) ? FuzzyBoolean.toFuzzyBoolean(this.min == right.max) : JelType.op('>>=', this.min, right.max); // TODO!
			else if (operator == '<<=')
				return (this.max == null || right.min == null) ? FuzzyBoolean.toFuzzyBoolean(this.max == right.min) : JelType.op('<<=', this.max, right.min);
			else if (operator == '>=')
				return (this.max == null || right.max == null) ? FuzzyBoolean.toFuzzyBoolean(this.max == null) : JelType.op('>=', this.max, right.max);
			else if (operator == '<=')
				return (this.min == null || right.min == null) ? FuzzyBoolean.toFuzzyBoolean(this.min == null) : JelType.op('<=', this.min, right.min);
		}
		else if (typeof right == 'number' || right instanceof Fraction || right instanceof UnitValue || right instanceof ApproximateNumber) {
			if (operator == '==')
				return this.contains(right);
			else if (operator == '===')
				return JelType.op('===', this.min, right).and(JelType.op('===', this.max, right));
			else if (operator == '>>')
				return this.min != null ? JelType.op('>>', this.min, right) : FuzzyBoolean.CLEARLY_FALSE;
			else if (operator == '<<')
				return this.max != null ? JelType.op('<<', this.max, right) : FuzzyBoolean.CLEARLY_FALSE;
			else if (operator == '>')
				return this.min != null ? JelType.op('>', this.min, right) : FuzzyBoolean.CLEARLY_FALSE;
			else if (operator == '<')
				return this.max != null ? JelType.op('<', this.max, right) : FuzzyBoolean.CLEARLY_FALSE;
			else if (operator == '>>=')
				return this.op('>>', right).or(this.contains(right));
			else if (operator == '<<=')
				return this.op('<<', right).or(this.contains(right));
			else if (operator == '>=')
				return this.op('>', right).or(this.contains(right));
			else if (operator == '<=')
				return this.op('<', right).or(this.contains(right));
			else if (operator in RANGE_NUM_OPS)
				return new Range(this.min != null ? JelType.op(operator, this.min, right) : this.min, 
												 this.max != null ? JelType.op(operator, this.max, right) : this.max);
		}
		return super.op(operator, right);
	}
	
	contains_jel_mapping: Object;
	contains(right: any): FuzzyBoolean {
		return (this.min == null ? FuzzyBoolean.CLEARLY_TRUE : JelType.op('<=', this.min, right)).and(this.max == null ? FuzzyBoolean.CLEARLY_TRUE : JelType.op('>=', this.max, right));
	}
	
	getSerializationProperties(): any[] {
		return [this.min, this.max];
	}
	
	static withAccuracy(value: number, accuracy: number): Range {
		return new Range(value - accuracy, value + accuracy);
	}
	
	static create_jel_mapping = {min:0, max:1};
	static create(min: number | Fraction | UnitValue, max: number | Fraction | UnitValue): Range {
		return new Range(min, max);
	}
}

Range.prototype.contains_jel_mapping = {right: 0};

	