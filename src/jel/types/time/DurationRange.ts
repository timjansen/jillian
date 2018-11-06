import * as moment from 'moment';

import JelObject from '../../JelObject';
import Runtime from '../../Runtime';
import Context from '../../Context';
import Util from '../../../util/Util';
import Range from '../Range';
import JelNumber from '../JelNumber';
import JelBoolean from '../JelBoolean';
import UnitValue from '../UnitValue';
import Duration from './Duration';
import Fraction from '../Fraction';
import ApproximateNumber from '../ApproximateNumber';

/**
 * A complex, calendar-based duration (simple durations, like year or seconds, can use UnitValue with Range)
 */
export default class DurationRange extends Range {
	
	constructor(min: Duration, max: Duration) {
		super(min, max);
		if (!min || !max)
			throw new Error('Min and max parameters are both required for a DurationRange)');
	}
	
	op(ctx: Context, operator: string, right: JelObject): JelObject|Promise<JelObject> {
		if ((right instanceof Duration) || (right instanceof UnitValue)) {
			switch (operator) {
				case '+':
				case '-':
					if (right instanceof UnitValue && !right.isType(ctx, 'Second'))
						return Util.resolveValue(right.convertTo(ctx, 'Second'), r=>this.op(ctx, operator, r));
					return new DurationRange(Runtime.op(ctx, operator, this.min, right) as Duration, Runtime.op(ctx, operator, this.max, right) as Duration);
			}
		}
		else if (right instanceof DurationRange) {
			switch (operator) {
				case '+':
				case '-': 
					return new DurationRange(Runtime.op(ctx, operator, this.min, right.min) as Duration, Runtime.op(ctx, operator, this.max, right.max) as Duration);
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
	contains(ctx: Context, value: JelObject|null): JelBoolean {
		if (value == null)
			return JelBoolean.valueOf(!this.isFinite());
		if (value instanceof DurationRange)
			return this.contains(ctx, value.min).and(ctx, this.contains(ctx, value.max));
		return (Runtime.op(ctx, '>=', value, this.min) as JelBoolean).and(ctx, Runtime.op(ctx, '<=', value, this.max) as JelBoolean);
	}
	
	getSerializationProperties(): any[] {
		return [this.min, this.max];
	}
	
	static create_jel_mapping = {min: 1, max: 2};
	static create(ctx: Context, ...args: any[]): DurationRange {
		return new DurationRange(args[0], args[1]);
	}

}

DurationRange.prototype.contains_jel_mapping = {value: 1};
DurationRange.prototype.reverseOps = JelObject.SWAP_OPS;

