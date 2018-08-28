import * as moment from 'moment';

import JelType from '../../JelType';
import Context from '../../Context';
import UnitValue from '../UnitValue';
import FuzzyBoolean from '../FuzzyBoolean';

/**
 * A complex, calendar-based duration (simple durations, like year or seconds, can use UnitValue)
 */
export default class Duration extends JelType {
	
	constructor(public readonly years = 0, public readonly months = 0, public readonly days = 0, public readonly hours = 0, public readonly minutes: number = 0, public seconds: number = 0) {
		super();
	}
	
	op(ctx: Context, operator: string, right: any): any {
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
					return this.simplify().op(ctx, JelType.STRICT_OPS[operator], right.simplify());
				case '===':
					return FuzzyBoolean.toFuzzyBoolean(this.years == right.years && this.months == right.months && this.days == right.days && this.hours == right.hours && this.minutes == right.minutes &&
						this.seconds == right.seconds);
				case '>>':
					return FuzzyBoolean.toFuzzyBoolean(this.years > right.years || 
						(this.years == right.years && this.months > right.months) || 
						(this.years == right.years && this.months == right.months && this.days > right.days) || 
						(this.years == right.years && this.months == right.months && this.days == right.days && this.hours > right.hours) || 
						(this.years == right.years && this.months == right.months && this.days == right.days && this.hours == right.hours && this.minutes > right.minutes) || 
						(this.years == right.years && this.months == right.months && this.days == right.days && this.hours == right.hours && this.minutes == right.minutes && this.seconds > right.seconds));
			}
		}
		else if (right instanceof UnitValue && right.unit.isType(ctx, 'Second')) {
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
					return FuzzyBoolean.toFuzzyBoolean(value >= minSecsDate && value <= maxSecsDate);
				case '===': // complex eq: only when sure that seconds match
					return FuzzyBoolean.toFuzzyBoolean(fixedSecs == minSecsDate && value == fixedSecs);
				case '>':
					return FuzzyBoolean.toFuzzyBoolean(minSecsDate > value);
				case '>>':
					return FuzzyBoolean.toFuzzyBoolean(maxSecsDate > value);
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
		return super.op(ctx, operator, right);
	}

	singleOp(ctx: Context, operator: string): any {
		if (operator == '!') 
			return FuzzyBoolean.toFuzzyBoolean(!(this.years || this.months || this.days || this.hours || this.minutes || this.seconds));
		else if (operator == '-') 
			return new Duration(-this.years, -this.months, -this.hours, -this.minutes, -this.seconds);
		else
			return JelType.singleOp(ctx, operator, this);
	}

	toEstimatedSeconds_jel_mapping: any;
	toEstimatedSeconds(ctx: Context): UnitValue {
		const self = this.simplify();
		const yDays = self.years % 4 * 365 + Math.floor(self.years / 4) * 4 * 365.25;
		const mDays = Math.trunc(self.months * 30.5);
		const hours = (yDays + mDays + self.days) * 24 + self.hours;
		return new UnitValue(hours * 3600 + self.minutes * 60 + self.seconds, ctx.dbSession.createDbRef('Second'));
	}
	
	fullDays_jel_mapping: any;
	fullDays(): Duration {
		const dDays = Math.floor((this.hours + this.minutes / 60 + this.seconds / 3600) / 24);
		return new Duration(this.years, this.months, this.days + dDays);
	}
	
	simplify_jel_mapping: any;
	simplify(): Duration {
		const allSecs = this.seconds + this.minutes*60 + this.hours * 3600 + this.days * 3600 * 24;
		const days = Math.trunc(allSecs / (3600*24));
		const hours = Math.trunc((allSecs - 3600 * 24 * days) / 3600);
		const minutes = Math.trunc((allSecs - 3600 * 24 * days - 3600 * hours) / 60);
		const seconds = allSecs - 3600 * 24 * days - 3600 * hours - 60 * minutes;
		
		// cut here: we can't reliably convert days into months

		const allMonths = this.months + this.years * 12;
		const years = Math.trunc(allMonths / 12);
		const months = allMonths - years * 12;
		
		if (this.days != days || this.hours != hours || this.minutes != minutes || this.seconds != seconds || 
				this.years != years || this.months != months)
			return new Duration(years, months, days, hours, minutes, seconds);
		else
			return this;
	}
	
	getSerializationProperties(): any[] {
		return [this.years, this.months, this.days, this.hours, this.minutes, this.seconds];
	}
	
	static create_jel_mapping = {years: 1, months: 2, days: 3, hours: 4, minute: 5, seconds: 6};
	static create(ctx: Context, ...args: any[]): any {
		return new Duration(args[0], args[1], args[2], args[3], args[4], args[5]);
	}

}

Duration.prototype.fullDays_jel_mapping = {};
Duration.prototype.simplify_jel_mapping = {};
Duration.prototype.toEstimatedSeconds_jel_mapping = {};


