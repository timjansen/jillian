import * as moment from 'moment';

import JelType from '../../JelType';
import UnitValue from '../UnitValue';
import FuzzyBoolean from '../FuzzyBoolean';

/**
 * A complex, calendar-based duration (simple durations, like year or seconds, can use UnitValue)
 */
export default class Duration extends JelType {
	
	constructor(public readonly years = 0, public readonly months = 0, public readonly days = 0, public readonly hours = 0, public readonly minutes: number = 0, public seconds: number = 0) {
		super();
	}
	
	op(operator: string, right: any): any {
		if (right instanceof Duration) {
			switch (operator) {
				case '+':
					return new Duration(this.years+right.years, this.months+right.months, this.days+right.days, this.hours+right.hours, this.minutes+right.minutes, this.seconds+right.seconds).simplify();
				case '-':
					return new Duration(this.years-right.years, this.months-right.months, this.days-right.days, this.hours-right.hours, this.minutes-right.minutes, this.seconds-right.seconds).simplify();
				case '==':
				case '!=':
				case '>':
				case '<':
				case '<=':
				case '>=':
					return this.simplify().op(JelType.STRICT_OPS[operator], right.simplify());
				case '===':
					return this.years == right.years && this.months == right.months && this.days == right.days && this.hours == right.hours && this.minutes == right.minutes &&
						this.seconds == right.seconds;
				case '>>':
					return this.years > right.years || 
						(this.years == right.years && this.months > right.months) || 
						(this.years == right.years && this.months == right.months && this.days > right.days) || 
						(this.years == right.years && this.months == right.months && this.days == right.days && this.hours > right.hours) || 
						(this.years == right.years && this.months == right.months && this.days == right.days && this.hours == right.hours && this.minutes > right.minutes) || 
						(this.years == right.years && this.months == right.months && this.days == right.days && this.hours == right.hours && this.minutes == right.minutes && this.seconds > right.seconds);
			}
		}
		else if (right instanceof UnitValue && right.unit.distinctName == 'Second') {
			const value = right.toNumber();
			const fixedSecs = this.hours * 3600 + this.minutes * 60 + this.seconds;
			const minSecsDate = this.days * 23 * 3600 + (this.months * 28 * 24 - 1) * 3600 + this.years * 365 * 24 * 3600 + fixedSecs;
			const maxSecsDate = this.days * 25 * 3600 + (this.months * 31 * 24 + 1) * 3600 + this.years * 366 * 24 * 3600 + fixedSecs;
			switch (operator) {
				case '+':					
					return new Duration(this.years, this.months, this.days, this.hours, this.minutes, this.seconds + value).simplify();
				case '-':					
					return new Duration(this.years, this.months, this.days, this.hours, this.minutes, this.seconds - value).simplify();
				case '==': // simple eq: true if seconds COULD be the same, all worst cases considered (e.g. february, leap years, daylight saving...)
					return value >= minSecsDate && value <= maxSecsDate;
				case '===': // complex eq: only when sure that seconds match
					return fixedSecs == minSecsDate && value == fixedSecs;
				case '>':
					return minSecsDate > value;
				case '>>':
					return maxSecsDate > value;
			}
		}
		else if (typeof right == 'number') {
			switch (operator) {
				case '*':					
					return new Duration(this.years * right, this.months * right, this.days * right, this.hours * right, this.minutes * right, this.seconds * right).simplify();
				case '/':					
					return right ? new Duration(this.years / right, this.months / right, this.days / right, this.hours / right, this.minutes / right, this.seconds / right).simplify() : new Duration(0);
			}
		}
		return super.op(operator, right);
	}

	singleOp(operator: string): any {
		if (operator == '!') 
			return !(this.years || this.months || this.days || this.hours || this.minutes || this.seconds);
		else
			return JelType.singleOp(operator, this);
	}

	toEstimatedSeconds_jel_mapping: any;
	toEstimatedSeconds(): UnitValue {
		const self = this.simplify();
		const yDays = self.years % 4 * 365 + Math.floor(self.years / 4) * 4 * 365.25;
		const mDays = Math.floor(self.months * 30.5);
		const hours = (yDays + mDays + self.days) * 24 + self.hours;
		return new UnitValue(hours * 3600 + self.minutes * 60 + self.seconds, 'Second');
	}
	
	simplify(): Duration {
		const oMinutes = this.seconds % 60;
		const newSeconds = this.seconds - oMinutes * 60;

		const oHours = (this.minutes + oMinutes) % 60;
		const newMinutes = this.minutes - oHours * 60;

		const oDays = (this.hours + oHours) % 24;
		const newHours = this.hours - oDays * 24;
		const newDays = this.days + oDays;
		
		// cut here: we can't reliably convert days into months

		const oMonths = this.months % 12;
		const newYears = this.years + oMonths;
		const newMonths = this.months - oMonths * 12;
		
		if (oMinutes || oHours || oDays || oMonths)
			return new Duration(newYears, newMonths, newDays, newHours, newMinutes, newSeconds);
		else
			return this;
	}
	
	getSerializationProperties(): any[] {
		return [this.years, this.months, this.days, this.hours, this.minutes, this.seconds];
	}
	
	static create_jel_mapping = {years: 0, months: 1, days: 2, hours: 3, minute: 4, seconds: 5};
	static create(...args: any[]): any {
		return new Duration(args[0], args[1], args[2], args[3], args[4], args[5]);
	}

}

Duration.prototype.toEstimatedSeconds_jel_mapping = {};


