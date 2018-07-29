import * as moment from 'moment';

import JelType from '../../JelType';
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
	
	op(operator: string, right: any): any {
		if ((right instanceof Duration) ||
			 (right instanceof UnitValue && right.unit.distinctName == 'Second')) {
			switch (operator) {
				case '+':
				case '-':
					return new DurationRange(JelType.op(operator, this.min, right), JelType.op(operator, this.max, right));
				case '===':
				case '!==':
				case '>>':
				case '<<':
				case '<<=':
				case '>>=':
					return JelType.op(operator, this.max, right).and(JelType.op(operator, this.min, right));
				case '=':
					return this.contains(right);
				case '>':
					return JelType.op('>', this.max, right);
				case '<':
					return JelType.op('<', this.min, right);
				case '>=':
					return JelType.op('>', this.min, right);
				case '<=':
					return JelType.op('<', this.max, right);
			}
		}
		else if (typeof right == 'number') {
			switch (operator) {
				case '*':					
				case '/':					
					return new DurationRange(JelType.op(operator, this.min, right), JelType.op(operator, this.max, right));
			}
		}
		return super.op(operator, right);
	}

	contains(value: Duration|UnitValue): FuzzyBoolean {
		return JelType.op('>=', value, this.min).and(JelType.op('<=', value, this.max));
	}
	
	getSerializationProperties(): any[] {
		return [this.min, this.max];
	}
	
	static create_jel_mapping = {min: 0, max: 1};
	static create(...args: any[]): any {
		return new DurationRange(args[0], args[1]);
	}

}


