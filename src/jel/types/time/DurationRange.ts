import * as moment from 'moment';

import JelObject from '../../JelObject';
import Runtime from '../../Runtime';
import Context from '../../Context';
import Util from '../../../util/Util';
import JelNumber from '../JelNumber';
import JelBoolean from '../JelBoolean';
import UnitValue from '../UnitValue';
import Duration from './Duration';
import Fraction from '../Fraction';
import ApproximateNumber from '../ApproximateNumber';

/**
 * A complex, calendar-based duration (simple durations, like year or seconds, can use UnitValue with Range)
 */
export default class DurationRange extends JelObject {
	
	constructor(public min: Duration, public max: Duration) {
		super();
		
		if (!min || !max)
			throw new Error('Min and max parameters are both required for a DurationRange)');
	}
	
	op(ctx: Context, operator: string, right: JelObject): JelObject|Promise<JelObject> {
		if (right instanceof UnitValue && !JelBoolean.toRealBoolean(right.unit.isType(ctx, 'Second')))
			return Util.resolveValue(right.convertTo(ctx, 'Second'), r=>this.op(ctx, operator, r));
		if ((right instanceof Duration) || (right instanceof UnitValue)) {

			switch (operator) {
				case '+':
				case '-':
					return new DurationRange(Runtime.op(ctx, operator, this.min, right) as Duration, Runtime.op(ctx, operator, this.max, right) as Duration);
				case '===':
				case '!==':
				case '>>':
				case '<<':
				case '<<=':
				case '>>=':
					return (this.max.op(ctx, operator, right) as JelBoolean).and(ctx, this.min.op(ctx, operator, right) as JelBoolean);
				case '==':
					return this.contains(ctx, right);
				case '>':
					return Runtime.op(ctx, '>', this.max, right);
				case '<':
					return Runtime.op(ctx, '<', this.min, right);
				case '>=':
					return Runtime.op(ctx, '>', this.min, right);
				case '<=':
					return Runtime.op(ctx, '<', this.max, right);
			}
		}
		else if (right instanceof DurationRange) {
			switch (operator) {
				case '+':
				case '-': 
					return new DurationRange(Runtime.op(ctx, operator, this.min, right.min) as Duration, Runtime.op(ctx, operator, this.max, right.max) as Duration);
				case '===':
				case '==':
					return (this.min.op(ctx, operator, right.min) as JelBoolean).and(ctx, this.max.op(ctx, operator, right.max) as JelBoolean);
				case '!==':
				case '!=':
					return (this.min.op(ctx, operator, right.min) as JelBoolean).or(ctx, this.max.op(ctx, operator, right.max) as JelBoolean);
				case '>>':
				case '>':
					return this.min.op(ctx, operator, right.max);
				case '>>=':
				case '>=':
					return this.max.op(ctx, operator, right.max);
				case '<<':
				case '<':
					return this.max.op(ctx, operator, right.min);
				case '<<=':
				case '<=':
					return this.min.op(ctx, operator, right.min);
			}
		}
		else if (right instanceof JelNumber || right instanceof Fraction || right instanceof ApproximateNumber) {
			switch (operator) {
				case '*':					
				case '/':					
					return new DurationRange(Runtime.op(ctx, operator, this.min, right) as Duration, Runtime.op(ctx, operator, this.max, right) as Duration);
			}
		}
		return super.op(ctx, operator, right);
	}

	contains_jel_mapping: Object;
	contains(ctx: Context, value: Duration|UnitValue|DurationRange): JelBoolean {
		if (value instanceof DurationRange)
			return this.contains(ctx, value.min).and(ctx, this.contains(ctx, value.max));
		return (Runtime.op(ctx, '>=', value, this.min) as JelBoolean).and(ctx, Runtime.op(ctx, '<=', value, this.max) as JelBoolean);
	}
	
	getSerializationProperties(): any[] {
		return [this.min, this.max];
	}
	
	static create_jel_mapping = {min: 1, max: 2};
	static create(ctx: Context, ...args: any[]): any {
		return new DurationRange(args[0], args[1]);
	}

}

DurationRange.prototype.contains_jel_mapping = {value: 1};
DurationRange.prototype.reverseOps = JelObject.SWAP_OPS;

