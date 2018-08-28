import * as moment from 'moment';

import JelType from '../../JelType';
import Context from '../../Context';
import FuzzyBoolean from '../FuzzyBoolean';
import UnitValue from '../UnitValue';
import Duration from './Duration';

/**
 * A complex, calendar-based duration (simple durations, like year or seconds, can use UnitValue with Range)
 */
export default class DurationRange extends JelType {
	
	constructor(public min: Duration, public max: Duration) {
		super();
	}
	
	op(ctx: Context, operator: string, right: any): any {
		if ((right instanceof Duration) ||
			 (right instanceof UnitValue && right.unit.isType(ctx, 'Second'))) {
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
					return JelType.op(ctx, operator, this.max, right).and(JelType.op(ctx, operator, this.min, right));
				case '=':
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
		else if (typeof right == 'number') {
			switch (operator) {
				case '*':					
				case '/':					
					return new DurationRange(JelType.op(ctx, operator, this.min, right), JelType.op(ctx, operator, this.max, right));
			}
		}
		return super.op(ctx, operator, right);
	}

	contains(ctx: Context, value: Duration|UnitValue): FuzzyBoolean {
		return JelType.op(ctx, '>=', value, this.min).and(JelType.op(ctx, '<=', value, this.max));
	}
	
	getSerializationProperties(): any[] {
		return [this.min, this.max];
	}
	
	static create_jel_mapping = {min: 0, max: 1};
	static create(...args: any[]): any {
		return new DurationRange(args[0], args[1]);
	}

}


