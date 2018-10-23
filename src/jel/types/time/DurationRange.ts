import * as moment from 'moment';

import JelType from '../../JelType';
import Context from '../../Context';
import Util from '../../../util/Util';
import FuzzyBoolean from '../FuzzyBoolean';
import UnitValue from '../UnitValue';
import Duration from './Duration';
import Fraction from '../Fraction';
import ApproximateNumber from '../ApproximateNumber';

/**
 * A complex, calendar-based duration (simple durations, like year or seconds, can use UnitValue with Range)
 */
export default class DurationRange extends JelType {
	
	constructor(public min: Duration, public max: Duration) {
		super();
		
		if (!min || !max)
			throw new Error('Min and max parameters are both required for a DurationRange)');
	}
	
	op(ctx: Context, operator: string, right: any): any {
		if (right instanceof UnitValue && !FuzzyBoolean.toRealBoolean(right.unit.isType(ctx, 'Second')))
			return Util.resolveValue(right.convertTo(ctx, 'Second'), r=>this.op(ctx, operator, r));
		if ((right instanceof Duration) || (right instanceof UnitValue)) {

			switch (operator) {
				case '+':
				case '-':
					return new DurationRange(JelType.op(ctx, operator, this.min, right), JelType.op(ctx, operator, this.max, right));
				case '===':
				case '!==':
				case '>>':
				case '<<':
				case '<<=':
				case '>>=':
					return JelType.op(ctx, operator, this.max, right).and(ctx, JelType.op(ctx, operator, this.min, right));
				case '==':
					return this.contains(ctx, right);
				case '>':
					return JelType.op(ctx, '>', this.max, right);
				case '<':
					return JelType.op(ctx, '<', this.min, right);
				case '>=':
					return JelType.op(ctx, '>', this.min, right);
				case '<=':
					return JelType.op(ctx, '<', this.max, right);
			}
		}
		else if (right instanceof DurationRange) {
			switch (operator) {
				case '+':
				case '-': 
					return new DurationRange(JelType.op(ctx, operator, this.min, right.min), JelType.op(ctx, operator, this.max, right.max));
				case '===':
				case '==':
					return JelType.op(ctx, operator, this.min, right.min).and(ctx, JelType.op(ctx, operator, this.max, right.max));
				case '!==':
				case '!=':
					return JelType.op(ctx, operator, this.min, right.min).or(ctx, JelType.op(ctx, operator, this.max, right.max));
				case '>>':
				case '>':
					return JelType.op(ctx, operator, this.min, right.max);
				case '>>=':
				case '>=':
					return JelType.op(ctx, operator, this.max, right.max);
				case '<<':
				case '<':
					return JelType.op(ctx, operator, this.max, right.min);
				case '<<=':
				case '<=':
					return JelType.op(ctx, operator, this.min, right.min);
			}
		}
		else if (typeof right == 'number' || right instanceof Fraction || right instanceof ApproximateNumber) {
			switch (operator) {
				case '*':					
				case '/':					
					return new DurationRange(JelType.op(ctx, operator, this.min, right), JelType.op(ctx, operator, this.max, right));
			}
		}
		return super.op(ctx, operator, right);
	}

	contains_jel_mapping: Object;
	contains(ctx: Context, value: Duration|UnitValue|DurationRange): FuzzyBoolean {
		if (value instanceof DurationRange)
			return this.contains(ctx, value.min).and(ctx, this.contains(ctx, value.max));
		return JelType.op(ctx, '>=', value, this.min).and(ctx, JelType.op(ctx, '<=', value, this.max));
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

