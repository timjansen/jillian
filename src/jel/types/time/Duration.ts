import * as moment from 'moment';

import JelObject from '../../JelObject';
import Runtime from '../../Runtime';
import Context from '../../Context';
import Util from '../../../util/Util';
import Dictionary from '../Dictionary';
import JelNumber from '../JelNumber';
import Unit from '../Unit';
import UnitValue from '../UnitValue';
import FuzzyBoolean from '../FuzzyBoolean';
import Fraction from '../Fraction';
import ApproximateNumber from '../ApproximateNumber';

// minimum/maximum length of x months
const minDaysForMonths = [0, 28, 28+31, 28+31+30, 28+31+30+31, 28+31+30+31+30, 28+31+30+31+30+31, 28+31+30+31+30+31+31, 28+31+30+31+30+31+31+30, 28+31+30+31+30+31+31+30+31, 28+31+30+31+30+31+31+30+31+30, 28+31+30+31+30+31+31+30+31+30+31, 365]; 
const maxDaysForMonths = [0, 31, 31+31, 31+31+30, 31+31+30+31, 31+31+30+31+30, 31+31+30+31+30+31, 31+31+30+31+30+31+31, 30+31+31+30+31+30+31+31, 31+30+31+31+30+31+30+31+31, 30+31+30+31+31+30+31+30+31+31, 31+30+31+30+31+31+30+31+30+31+31, 366]; 

function estimateMinDaysForYears(years: number): number {
	const absYears = Math.abs(years);
	const minLeapYears = Math.max(0, Math.floor((absYears-4)/4));
	return years * 365 + minLeapYears;
}

function estimateMaxDaysForYears(years: number): number {
	const absYears = Math.abs(years);
	const maxLeapYears = Math.ceil(absYears/4);
	return years * 365 + maxLeapYears;
}

function estimateDaysForMonths(minMaxTable: number[], months: number): number {
	if (Math.abs(months) < minMaxTable.length)
		return minMaxTable[Math.abs(months)]*Math.sign(months);

	const fullYears = Math.floor(Math.abs(months/12)) * Math.sign(months);
	const remainingMonths = (Math.abs(months)-fullYears*12) * Math.sign(months);
	return fullYears * minMaxTable[12] + estimateDaysForMonths(minMaxTable, remainingMonths);
}


/**
 * A complex, calendar-based duration (simple durations, like year or seconds, can use UnitValue)
 */
export default class Duration extends JelObject {
	private typicalSecs: number;
	private minSecs: number;
	private maxSecs: number;
	
	constructor(public readonly years = 0, public readonly months = 0, public readonly days = 0, public readonly hours = 0, public readonly minutes: number = 0, public seconds: number = 0) {
		super();

		const fixedSecs = this.hours * 3600 + this.minutes * 60 + this.seconds;
		const minDays = this.days + estimateDaysForMonths(minDaysForMonths, this.months);
		const maxDays = this.days + estimateDaysForMonths(minDaysForMonths, this.months);
		const dstChangeOffset = this.days == 0 ? 0 : 1;
		
		const absYears = Math.abs(this.years);
		const minLeapYears = Math.max(0, Math.floor((absYears-4)/4));
		const maxLeapYears = Math.ceil(absYears/4);

		this.minSecs = (minDays * 24 - dstChangeOffset) * 3600 + estimateMinDaysForYears(this.years) * 24 * 3600 + fixedSecs;
		this.maxSecs = (maxDays * 24 + dstChangeOffset) * 3600 + estimateMaxDaysForYears(this.years) * 24 * 3600 + fixedSecs;
		
		const typicalDays = this.days + estimateMinDaysForYears(this.years) + Math.ceil((estimateDaysForMonths(minDaysForMonths, this.months)+estimateDaysForMonths(maxDaysForMonths, this.months))/2);
		this.typicalSecs = fixedSecs + typicalDays * 24 * 3600; 
	}
	
	op(ctx: Context, operator: string, right: JelObject): JelObject|Promise<JelObject> {
		if (right instanceof Duration) {
			switch (operator) {
				case '+':
					return new Duration(this.years+right.years, this.months+right.months, this.days+right.days, this.hours+right.hours, this.minutes+right.minutes, this.seconds+right.seconds).simplify();
				case '-':
					return new Duration(this.years-right.years, this.months-right.months, this.days-right.days, this.hours-right.hours, this.minutes-right.minutes, this.seconds-right.seconds).simplify();
				case '*':
				case '/':
					return Runtime.op(ctx, operator, this.toEstimatedSeconds(ctx), right.toEstimatedSeconds(ctx));
				
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
					return Runtime.op(ctx, operator, JelNumber.valueOf(this.typicalSecs), JelNumber.valueOf(right.typicalSecs));
					
				case '===':
					return FuzzyBoolean.valueOf(this.years == right.years && this.months == right.months && this.days == right.days && this.hours == right.hours && this.minutes == right.minutes &&
						this.seconds == right.seconds);
			}
		}
		else if (right instanceof UnitValue) {
			if (!right.isType(ctx, 'Second').toRealBoolean()) {
				return Util.resolveValue(right.convertTo(ctx, 'Second'), r=>this.op(ctx, operator, r));
			}
			const value = JelNumber.toRealNumber(right);
			const simplified = this.simplify();
			const fixedSecs = this.hours * 3600 + this.minutes * 60 + this.seconds;

			switch (operator) {
				case '+':					
					return new Duration(simplified.years, simplified.months, simplified.days, simplified.hours, simplified.minutes, simplified.seconds + value).simplify();
				case '-':					
					return new Duration(simplified.years, simplified.months, simplified.days, simplified.hours, simplified.minutes, simplified.seconds - value).simplify();
				case '*':
				case '/':
					return Runtime.op(ctx, operator, this.toEstimatedSeconds(ctx), right);
					
				case '==': // simple eq: true if seconds COULD be the same, all worst cases considered (e.g. february, leap years, daylight saving...)
					return FuzzyBoolean.valueOf(value >= this.minSecs && value <= this.maxSecs);
				case '!=': 
					return FuzzyBoolean.valueOf(value < this.minSecs || value > this.maxSecs);
				case '===': // complex eq: only when sure that seconds match
					return FuzzyBoolean.valueOf(fixedSecs == this.minSecs && value == fixedSecs);
				case '!==': 
					return FuzzyBoolean.valueOf(fixedSecs != this.minSecs || value != fixedSecs);
				case '>':
					return FuzzyBoolean.twoPrecision(ctx, this.typicalSecs > value, this.maxSecs > value);
				case '>>':
					return FuzzyBoolean.valueOf(this.maxSecs > value);
				case '<':
					return FuzzyBoolean.twoPrecision(ctx, this.typicalSecs < value, this.minSecs < value);
				case '<<':
					return FuzzyBoolean.valueOf(this.minSecs < value);
				case '>=':
					return FuzzyBoolean.twoPrecision(ctx, this.typicalSecs >= value, this.maxSecs >= value);
				case '>>=':
					return FuzzyBoolean.valueOf(this.maxSecs >= value);
				case '<=':
					return FuzzyBoolean.twoPrecision(ctx, this.typicalSecs <= value, this.minSecs <= value);
				case '<<=':
					return FuzzyBoolean.valueOf(this.minSecs <= value);
			}
		}
		else if (right instanceof JelNumber || right instanceof Fraction || right instanceof ApproximateNumber) {
			const r = JelNumber.toRealNumber(right);
			switch (operator) {
				case '*':
					return new Duration(this.years * r, this.months * r, this.days * r, this.hours * r, this.minutes * r, this.seconds * r).simplify();
				case '/':
					return r ? new Duration(this.years / r, this.months / r, this.days / r, this.hours / r, this.minutes / r, this.seconds / r).simplify() : new Duration(0);
			}
		}
		return super.op(ctx, operator, right);
	}
	
	singleOp(ctx: Context, operator: string): JelObject|Promise<JelObject> {
		if (operator == '!') {
			const s = this.simplify();
			return FuzzyBoolean.valueOf(!(s.years || s.months || s.days || s.hours || s.minutes || s.seconds));
		}
		else if (operator == '-') 
			return new Duration(-this.years, -this.months, -this.days, -this.hours, -this.minutes, -this.seconds).simplify();
		else
			return Runtime.singleOp(ctx, operator, this);
	}
	
	toEstimatedSeconds_jel_mapping: any;
	toEstimatedSeconds(ctx: Context): UnitValue {
		return new UnitValue(ApproximateNumber.createIfError(this.typicalSecs, Math.max(Math.abs(this.typicalSecs - this.minSecs), Math.abs(this.maxSecs - this.typicalSecs))), 'Second'); 
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
	
	private static toDuration(ctx: Context, x: any): Duration {
		if (x instanceof Duration)
			return x;
		if (x instanceof UnitValue)
			return Duration.create(ctx, x);
		throw new Error('Unsupported value, only Duration and second-convertible UnitValues supported');
	}

	private static minMax(ctx: Context, operator: string, args: any[]): Duration {
		if (args.length < 0)
			throw new Error('Missing parameters');
		let l = Duration.toDuration(ctx, args[0]);
		for (let d of args) {
			const dur = Duration.toDuration(ctx, d);
			if ((Runtime.op(ctx, operator, l, dur) as FuzzyBoolean).toRealBoolean())
				l = dur;
		}
	 return l;
	}

	static min_jel_mapping = {};
	static min(ctx: Context, ...a: any[]): Duration {
			return Duration.minMax(ctx, '>', a);
	}
	static max_jel_mapping = {};
	static max(ctx: Context, ...a: any[]): Duration {
			return Duration.minMax(ctx, '<', a);
	}
	
	getSerializationProperties(): any[] {
		return [this.years, this.months, this.days, this.hours, this.minutes, this.seconds];
	}
	
	toString(): string {
		return `Duration(years=${this.years} months=${this.months} days=${this.days} hours=${this.hours} minutes=${this.minutes} seconds=${this.seconds})`;
	}
	
	// create either with years/months/days/hours/minutes/seconds, or a UnitValue
	static create_jel_mapping = {unit: 1, years: 1, months: 2, days: 3, hours: 4, minutes: 5, seconds: 6};
	static create(ctx: Context, ...args: any[]): any {
		if (args[0] instanceof UnitValue) {
			const uv = args[0];
			if (uv.isType(ctx, 'Year').toRealBoolean())
				return new Duration(JelNumber.toRealNumber(uv));
			else if (uv.isType(ctx, 'Month').toRealBoolean())
				return new Duration(0, JelNumber.toRealNumber(uv));
			else if (uv.isType(ctx, 'Day').toRealBoolean())
				return new Duration(0, 0, JelNumber.toRealNumber(uv));
			else if (uv.isType(ctx, 'Hour').toRealBoolean())
				return new Duration(0, 0, 0, JelNumber.toRealNumber(uv));
			else if (uv.isType(ctx, 'Minute').toRealBoolean())
				return new Duration(0, 0, 0, 0, JelNumber.toRealNumber(uv));
			else if (uv.isType(ctx, 'Second').toRealBoolean())
				return new Duration(0, 0, 0, 0, 0, JelNumber.toRealNumber(uv));
			else
				return Util.resolveValue(uv.convertTo(ctx, 'Second'), r=>new Duration(0, 0, 0, 0, 0, JelNumber.toRealNumber(r)).simplify());
		}

		return new Duration(JelNumber.toRealNumber(args[0], 0), JelNumber.toRealNumber(args[1], 0), JelNumber.toRealNumber(args[2], 0), JelNumber.toRealNumber(args[3], 0), JelNumber.toRealNumber(args[4], 0), JelNumber.toRealNumber(args[5], 0));
	}

}

Duration.prototype.reverseOps = {
	'+': 1,
	'*': 1,
	'==': 1,
	'!=': 1,
	'===': 1,
	'!==': 1,
	'>': 1,
	'>>': 1,
	'<': 1,
	'<<': 1,
	'>=': 1,
	'>>=': 1,
	'<=': 1,
	'<<=': 1,
};
Duration.prototype.fullDays_jel_mapping = {};
Duration.prototype.simplify_jel_mapping = {};
Duration.prototype.toEstimatedSeconds_jel_mapping = {};


