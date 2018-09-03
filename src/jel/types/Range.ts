import Util from '../../util/Util';
import JelType from '../JelType';
import Context from '../Context';
import Fraction from './Fraction';
import Callable from '../Callable';
import UnitValue from './UnitValue';
import ApproximateNumber from './ApproximateNumber';
import FuzzyBoolean from './FuzzyBoolean';

const RANGE_NUM_OPS: any = {'+': true, '-': true, '*': true, '/': true};


/**
 * Represents a range of numeric values. Numbers can be primitive numbers of UnitValues. 
 * Ranges can be open-ended by passing a null for the min and/or max.
 */
export default class Range extends JelType {
	
	JEL_PROPERTIES: Object;

	constructor(public min?: number | Fraction | UnitValue | ApproximateNumber | null, public max?: number | Fraction | UnitValue | ApproximateNumber | null) {
		super();
	}
	
	op(ctx: Context, operator: string, right: any): any {
		if (operator == '!==')
			return this.op(ctx, '===', right).negate();
		else if (operator == '!=')
			return this.op(ctx, '==', right).negate();
		else if (right instanceof Range) {
			if (operator == '==')
				return FuzzyBoolean.orWithPromises(this.contains(ctx, right.min), this.contains(ctx, right.max), right.contains(ctx, this.min), right.contains(ctx, this.max));
			else if (operator == '===')
				return FuzzyBoolean.andWithPromises(JelType.op(ctx, '===', this.min, right.min), JelType.op(ctx, '===', this.max, right.max));
			else if (operator == '>>')
				return (right.max == null || this.min == null) ? FuzzyBoolean.FALSE : JelType.op(ctx, '>>', this.min, right.max);
			else if (operator == '<<')
				return (right.min == null || this.max == null) ? FuzzyBoolean.FALSE : JelType.op(ctx, '<<', this.max, right.min);
			else if (operator == '>')
				return (this.max == null || right.max == null) ? FuzzyBoolean.toFuzzyBoolean(this.max == null && right.max != null) : JelType.op(ctx, '>', this.max, right.max);
			else if (operator == '<')
				return (this.min == null || right.min == null) ? FuzzyBoolean.toFuzzyBoolean(this.min == null && right.min != null) : JelType.op(ctx, '<', this.min, right.min);
			else if (operator == '>>=')
				return (this.min == null || right.max == null) ? FuzzyBoolean.toFuzzyBoolean(this.min == right.max) : JelType.op(ctx, '>>=', this.min, right.max); // TODO!
			else if (operator == '<<=')
				return (this.max == null || right.min == null) ? FuzzyBoolean.toFuzzyBoolean(this.max == right.min) : JelType.op(ctx, '<<=', this.max, right.min);
			else if (operator == '>=')
				return (this.max == null || right.max == null) ? FuzzyBoolean.toFuzzyBoolean(this.max == null) : JelType.op(ctx, '>=', this.max, right.max);
			else if (operator == '<=')
				return (this.min == null || right.min == null) ? FuzzyBoolean.toFuzzyBoolean(this.min == null) : JelType.op(ctx, '<=', this.min, right.min);
		}
		else if (typeof right == 'number' || right instanceof Fraction || right instanceof UnitValue || right instanceof ApproximateNumber) {
			if (operator == '==')
				return this.contains(ctx, right);
			else if (operator == '===')
				return FuzzyBoolean.andWithPromises(JelType.op(ctx, '===', this.min, right), JelType.op(ctx, '===', this.max, right));
			else if (operator == '>>')
				return this.min != null ? JelType.op(ctx, '>>', this.min, right) : FuzzyBoolean.FALSE;
			else if (operator == '<<')
				return this.max != null ? JelType.op(ctx, '<<', this.max, right) : FuzzyBoolean.FALSE;
			else if (operator == '>')
				return this.min != null ? JelType.op(ctx, '>', this.min, right) : FuzzyBoolean.FALSE;
			else if (operator == '<')
				return this.max != null ? JelType.op(ctx, '<', this.max, right) : FuzzyBoolean.FALSE;
			else if (operator == '>>=')
				return FuzzyBoolean.orWithPromises(this.op(ctx, '>>', right), this.contains(ctx, right));
			else if (operator == '<<=')
				return FuzzyBoolean.orWithPromises(this.op(ctx, '<<', right), this.contains(ctx, right));
			else if (operator == '>=')
				return FuzzyBoolean.orWithPromises(this.op(ctx, '>', right), this.contains(ctx, right));
			else if (operator == '<=')
				return FuzzyBoolean.orWithPromises(this.op(ctx, '<', right), this.contains(ctx, right));
			else if (operator in RANGE_NUM_OPS)
				return new Range(this.min != null ? JelType.op(ctx, operator, this.min, right) : this.min, 
												 this.max != null ? JelType.op(ctx, operator, this.max, right) : this.max);
		}
		return super.op(ctx, operator, right);
	}
	
	contains_jel_mapping: Object;
	contains(ctx: Context, right: any): FuzzyBoolean | Promise<FuzzyBoolean> {
		return FuzzyBoolean.andWithPromises(this.min == null ? FuzzyBoolean.TRUE : JelType.op(ctx, '<=', this.min, right), this.max == null ? FuzzyBoolean.TRUE : JelType.op(ctx, '>=', this.max, right));
	}

	middle_jel_mapping: Object;
	middle(ctx: Context): number | Fraction | UnitValue | ApproximateNumber | null {
		if (this.min != null && this.max != null)
			return JelType.singleOpWithPromise(ctx, 'abs', JelType.op(ctx, '-', this.min, this.max));
		else
			return null;
	}

	isFinite_jel_mapping: Object;
	isFinite(): FuzzyBoolean {
		return FuzzyBoolean.toFuzzyBoolean(this.min != null && this.max != null);
	}
	
	getSerializationProperties(): any[] {
		return [this.min, this.max];
	}
	
	static withAccuracy(value: number, accuracy: number): Range {
		return new Range(value - accuracy, value + accuracy);
	}
	
	static create_jel_mapping = {min:1, max:2};
	static create(ctx: Context, min: number | Fraction | UnitValue, max: number | Fraction | UnitValue): Range {
		return new Range(min, max);
	}
}

Range.prototype.JEL_PROPERTIES = {min: 1, max: 1};
Range.prototype.contains_jel_mapping = {right: 1};
Range.prototype.middle_jel_mapping = {};
Range.prototype.isFinite_jel_mapping = {};

	