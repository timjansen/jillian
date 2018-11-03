import Util from '../../util/Util';
import Runtime from '../Runtime';
import JelObject from '../JelObject';
import Context from '../Context';
import JelNumber from './JelNumber';
import Fraction from './Fraction';
import Callable from '../Callable';
import UnitValue from './UnitValue';
import ApproximateNumber from './ApproximateNumber';
import JelBoolean from './JelBoolean';

const RANGE_NUM_OPS: any = {'+': true, '-': true, '*': true, '/': true};


/**
 * Represents a range of numeric values or time/dates. Ranges can be open-ended by passing a null for the min and/or max.
 */
export default class Range extends JelObject {
	
	JEL_PROPERTIES: Object;

	constructor(public min: JelObject | null, public max: JelObject | null) {
		super();
	}
	
	op(ctx: Context, operator: string, right: JelObject): JelObject|Promise<JelObject> {
		if (operator == '!==')
			return (this.op(ctx, '===', right) as JelBoolean).negate();
		else if (operator == '!=')
			return (this.op(ctx, '==', right) as JelBoolean).negate();
		else if (right instanceof Range) {
			if (operator == '==')
				return JelBoolean.orWithPromises(this.contains(ctx, right.min), this.contains(ctx, right.max), right.contains(ctx, this.min), right.contains(ctx, this.max));
			else if (operator == '===')
				return JelBoolean.andWithPromises(Runtime.op(ctx, '===', this.min, right.min) as JelBoolean, Runtime.op(ctx, '===', this.max, right.max) as JelBoolean);
			else if (operator == '>>')
				return (right.max == null || this.min == null) ? JelBoolean.FALSE : Runtime.op(ctx, '>>', this.min, right.max);
			else if (operator == '<<')
				return (right.min == null || this.max == null) ? JelBoolean.FALSE : Runtime.op(ctx, '<<', this.max, right.min);
			else if (operator == '>')
				return (this.max == null || right.max == null) ? JelBoolean.valueOf(this.max == null && right.max != null) : Runtime.op(ctx, '>', this.max, right.max);
			else if (operator == '<')
				return (this.min == null || right.min == null) ? JelBoolean.valueOf(this.min == null && right.min != null) : Runtime.op(ctx, '<', this.min, right.min);
			else if (operator == '>>=')
				return (this.min == null || right.max == null) ? JelBoolean.valueOf(this.min == right.max) : Runtime.op(ctx, '>>=', this.min, right.max); // TODO!
			else if (operator == '<<=')
				return (this.max == null || right.min == null) ? JelBoolean.valueOf(this.max == right.min) : Runtime.op(ctx, '<<=', this.max, right.min);
			else if (operator == '>=')
				return (this.max == null || right.max == null) ? JelBoolean.valueOf(this.max == null) : Runtime.op(ctx, '>=', this.max, right.max);
			else if (operator == '<=')
				return (this.min == null || right.min == null) ? JelBoolean.valueOf(this.min == null) : Runtime.op(ctx, '<=', this.min, right.min);
		}
		else if (right instanceof JelObject) {
			if (operator == '==')
				return this.contains(ctx, right);
			else if (operator == '===')
				return JelBoolean.andWithPromises(Runtime.op(ctx, '===', this.min, right) as JelBoolean, Runtime.op(ctx, '===', this.max, right) as JelBoolean);
			else if (operator == '>>')
				return this.min != null ? Runtime.op(ctx, '>>', this.min, right) : JelBoolean.FALSE;
			else if (operator == '<<')
				return this.max != null ? Runtime.op(ctx, '<<', this.max, right) : JelBoolean.FALSE;
			else if (operator == '>')
				return this.min != null ? Runtime.op(ctx, '>', this.min, right) : JelBoolean.FALSE;
			else if (operator == '<')
				return this.max != null ? Runtime.op(ctx, '<', this.max, right) : JelBoolean.FALSE;
			else if (operator == '>>=')
				return JelBoolean.orWithPromises(this.op(ctx, '>>', right) as JelBoolean, this.contains(ctx, right));
			else if (operator == '<<=')
				return JelBoolean.orWithPromises(this.op(ctx, '<<', right) as JelBoolean, this.contains(ctx, right));
			else if (operator == '>=')
				return JelBoolean.orWithPromises(this.op(ctx, '>', right) as JelBoolean, this.contains(ctx, right));
			else if (operator == '<=')
				return JelBoolean.orWithPromises(this.op(ctx, '<', right) as JelBoolean, this.contains(ctx, right));
			else if (operator in RANGE_NUM_OPS)
				return new Range(this.min != null ? Runtime.op(ctx, operator, this.min, right) as any: this.min, 
												 this.max != null ? Runtime.op(ctx, operator, this.max, right) as any: this.max);
		}
		return super.op(ctx, operator, right);
	}
	
	contains_jel_mapping: Object;
	contains(ctx: Context, right: JelObject | null): JelBoolean | Promise<JelBoolean> {
		if (right == null)
			return JelBoolean.valueOf(!this.isFinite());
		return JelBoolean.andWithPromises(this.min == null ? JelBoolean.TRUE : Runtime.op(ctx, '<=', this.min, right) as JelBoolean, this.max == null ? JelBoolean.TRUE : Runtime.op(ctx, '>=', this.max, right) as JelBoolean);
	}

	middle_jel_mapping: Object;
	middle(ctx: Context): JelObject | null {
		if (this.min != null && this.max != null)
			return Runtime.singleOpWithPromise(ctx, 'abs', Runtime.op(ctx, '-', this.min, this.max) as any) as any;
		else
			return null;
	}

	isFinite_jel_mapping: Object;
	isFinite(): boolean {
		return this.min != null && this.max != null;
	}
	
	getSerializationProperties(): any[] {
		return [this.min, this.max];
	}
	
	static withAccuracy(value: number, accuracy: number): Range {
		return new Range(JelNumber.valueOf(value - accuracy), JelNumber.valueOf(value + accuracy));
	}
	
	static create_jel_mapping = {min:1, max:2};
	static create(ctx: Context, min?: JelObject | null, max?: JelObject | null): Range {
		return new Range(min != null ? min : null, max != null ? max : null);
	}
}

Range.prototype.JEL_PROPERTIES = {min: 1, max: 1};
Range.prototype.contains_jel_mapping = {right: 1};
Range.prototype.middle_jel_mapping = {};
Range.prototype.isFinite_jel_mapping = {};
Range.prototype.reverseOps = JelObject.SWAP_OPS;

	