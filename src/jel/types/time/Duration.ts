import * as moment from 'moment';

import JelType from '../../JelType';
import Context from '../../Context';
import Util from '../../../util/Util';
import Dictionary from '../Dictionary';
import Unit from '../Unit';
import UnitValue from '../UnitValue';
import FuzzyBoolean from '../FuzzyBoolean';
import Fraction from '../Fraction';
import ApproximateNumber from '../ApproximateNumber';

// minimum/maximum length of x months
const minDaysForMonths = [0, 28, 28+31, 28+31+30, 28+31+30+31, 28+31+30+31+30, 28+31+30+31+30+31, 28+31+30+31+30+31+31, 28+31+30+31+30+31+31+30, 28+31+30+31+30+31+31+30+31, 28+31+30+31+30+31+31+30+31+30, 28+31+30+31+30+31+31+30+31+30+31]; 
const maxDaysForMonths = [0, 31, 31+31, 31+31+30, 31+31+30+31, 31+31+30+31+30, 31+31+30+31+30+31, 31+31+30+31+30+31+31, 30+31+31+30+31+30+31+31, 31+30+31+31+30+31+30+31+31, 30+31+30+31+31+30+31+30+31+31, 31+30+31+30+31+31+30+31+30+31+31]; 


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
				case '*':
				case '/':
					return JelType.op(ctx, operator, this.toEstimatedSeconds(ctx), right.toEstimatedSeconds(ctx));
				
				case '==':
				case '!=':
				case '>':
				case '<':
				case '<=':
				case '>=':
				case '>>':
				case '<<':
				case '<<=':
				case '>>=':
					return this.op(ctx, operator, right.toEstimatedSeconds(ctx));
					
				case '===':
					return FuzzyBoolean.toFuzzyBoolean(this.years == right.years && this.months == right.months && this.days == right.days && this.hours == right.hours && this.minutes == right.minutes &&
						this.seconds == right.seconds);
			}
		}
		else if (right instanceof UnitValue) {
			if (!FuzzyBoolean.toRealBoolean(right.unit.isType(ctx, 'Second')))
				return Util.resolveValue(right.convertTo(ctx, 'Second'), r=>this.op(ctx, operator, r));
			const value = right.toNumber();
			const simplified = this.simplify();
			const fixedSecs = simplified.hours * 3600 + simplified.minutes * 60 + simplified.seconds;
			const minDays = simplified.days + (Math.abs(simplified.months) < minDaysForMonths.length ? minDaysForMonths[Math.abs(simplified.months)]*Math.sign(simplified.months) : simplified.months*365);
			const maxDays = simplified.days + (Math.abs(simplified.months) < maxDaysForMonths.length ? maxDaysForMonths[Math.abs(simplified.months)]*Math.sign(simplified.months) : simplified.months*366);
			const dstChangeOffset = simplified.days == 0 ? 0 : 1;

			const minSecsDate = (minDays-dstChangeOffset) * 24 * 3600 + simplified.years * 365 * 24 * 3600 + fixedSecs;
			const maxSecsDate = (maxDays+dstChangeOffset) * 24 * 3600 + simplified.years * 366 * 24 * 3600 + fixedSecs;
			switch (operator) {
				case '+':					
					return new Duration(simplified.years, simplified.months, simplified.days, simplified.hours, simplified.minutes, simplified.seconds + value).simplify();
				case '-':					
					return new Duration(simplified.years, simplified.months, simplified.days, simplified.hours, simplified.minutes, simplified.seconds - value).simplify();
				case '*':
				case '/':
					return JelType.op(ctx, operator, this.toEstimatedSeconds(ctx), right);
					
				case '==': // simple eq: true if seconds COULD be the same, all worst cases considered (e.g. february, leap years, daylight saving...)
					return FuzzyBoolean.toFuzzyBoolean(value >= minSecsDate && value <= maxSecsDate);
				case '!=': 
					return FuzzyBoolean.toFuzzyBoolean(value < minSecsDate || value > maxSecsDate);
				case '===': // complex eq: only when sure that seconds match
					return FuzzyBoolean.toFuzzyBoolean(fixedSecs == minSecsDate && value == fixedSecs);
				case '!==': 
					return FuzzyBoolean.toFuzzyBoolean(fixedSecs != minSecsDate || value != fixedSecs);
				case '>':
					return FuzzyBoolean.toFuzzyBoolean(minSecsDate > value);
				case '>>':
					return FuzzyBoolean.toFuzzyBoolean(maxSecsDate > value);
				case '<':
					return FuzzyBoolean.toFuzzyBoolean(maxSecsDate < value);
				case '<<':
					return FuzzyBoolean.toFuzzyBoolean(minSecsDate < value);
				case '>=':
					return FuzzyBoolean.toFuzzyBoolean(minSecsDate >= value);
				case '>>=':
					return FuzzyBoolean.toFuzzyBoolean(maxSecsDate >= value);
				case '<=':
					return FuzzyBoolean.toFuzzyBoolean(maxSecsDate <= value);
				case '<<=':
					return FuzzyBoolean.toFuzzyBoolean(minSecsDate <= value);
			}
		}
		else if (typeof right == 'number' || right instanceof Fraction || right instanceof ApproximateNumber) {
			const r = JelType.toNumber(right);
			switch (operator) {
				case '*':
					return new Duration(this.years * r, this.months * r, this.days * r, this.hours * r, this.minutes * r, this.seconds * r).simplify();
				case '/':
					return r ? new Duration(this.years / r, this.months / r, this.days / r, this.hours / r, this.minutes / r, this.seconds / r).simplify() : new Duration(0);
			}
		}
		return super.op(ctx, operator, right);
	}
	
	singleOp(ctx: Context, operator: string): any {
		if (operator == '!') {
			const s = this.simplify();
			return FuzzyBoolean.toFuzzyBoolean(!(s.years || s.months || s.days || s.hours || s.minutes || s.seconds));
		}
		else if (operator == '-') 
			return new Duration(-this.years, -this.months, -this.days, -this.hours, -this.minutes, -this.seconds).simplify();
		else
			return JelType.singleOp(ctx, operator, this);
	}

	toEstimatedSeconds_jel_mapping: any;
	toEstimatedSeconds(ctx: Context): UnitValue {
		const self = this.simplify();
		const yDays = self.years % 4 * 365 + Math.floor(self.years / 4) * 4 * 365.25;
		const mDays = Math.trunc(self.months * 30.5);
		const hours = (yDays + mDays + self.days) * 24 + self.hours;
		return new UnitValue(hours * 3600 + self.minutes * 60 + self.seconds, 'Second'); // << nicer would be to use ApproximateNumber here
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
	
	static create_jel_mapping = {years: 1, months: 2, days: 3, hours: 4, minutes: 5, seconds: 6};
	static create(ctx: Context, ...args: any[]): any {
		return new Duration(JelType.toNumber(args[0], 0), JelType.toNumber(args[1], 0), JelType.toNumber(args[2], 0), JelType.toNumber(args[3], 0), JelType.toNumber(args[4], 0), JelType.toNumber(args[5], 0));
	}

}

Duration.prototype.fullDays_jel_mapping = {};
Duration.prototype.simplify_jel_mapping = {};
Duration.prototype.toEstimatedSeconds_jel_mapping = {};


