import * as moment from 'moment';

import JelObject from '../../JelObject';
import Runtime from '../../Runtime';
import Context from '../../Context';
import Util from '../../../util/Util';
import Dictionary from '../Dictionary';
import Float from '../Float';
import Unit from '../Unit';
import UnitValue from '../UnitValue';
import List from '../List';
import JelBoolean from '../JelBoolean';
import Fraction from '../Fraction';
import ApproximateNumber from '../ApproximateNumber';
import TypeChecker from '../TypeChecker';
import NativeJelObject from '../NativeJelObject';
import Class from '../Class';
import BaseTypeRegistry from '../../BaseTypeRegistry';

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
export default class Duration extends NativeJelObject {
  static clazz: Class|undefined;

	private typicalSecs: number;
	private minSecs: number;
	private maxSecs: number;
	
	constructor(public readonly years = 0, public readonly months = 0, public readonly days = 0, public readonly hours = 0, public readonly minutes: number = 0, public seconds: number = 0) {
		super('Duration');

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
  
  get clazz(): Class {
    return Duration.clazz!;
  }
	
	op(ctx: Context, operator: string, right: JelObject, isReversal: boolean = false): JelObject|Promise<JelObject> {
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
					return Runtime.op(ctx, operator, Float.valueOf(this.typicalSecs), Float.valueOf(right.typicalSecs));
					
				case '===':
					return JelBoolean.valueOf(this.years == right.years && this.months == right.months && this.days == right.days && this.hours == right.hours && this.minutes == right.minutes &&
						this.seconds == right.seconds);
			}
		}
		else if (right instanceof UnitValue) {
      if (Float.isInteger(ctx, right)) {
        if (right.isType(ctx, 'Year'))
          return this.op(ctx, operator, new Duration(Float.toRealNumber(right)));
        else if (right.isType(ctx, 'Month'))
          return this.op(ctx, operator, new Duration(0, Float.toRealNumber(right)));
        else if (right.isType(ctx, 'Week'))
          return this.op(ctx, operator, new Duration(0, 0, Float.toRealNumber(right)*7));
        else if (right.isType(ctx, 'Day'))
          return this.op(ctx, operator, new Duration(0, 0, Float.toRealNumber(right)));
      }
      if (!right.isType(ctx, 'Second')) {
				return Util.resolveValue(right.convertTo(ctx, 'Second'), r=>this.op(ctx, operator, r));
			}
			const value = Float.toRealNumber(right);
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
					return JelBoolean.valueOf(value >= this.minSecs && value <= this.maxSecs);
				case '!=': 
					return JelBoolean.valueOf(value < this.minSecs || value > this.maxSecs);
				case '===': // complex eq: only when sure that seconds match
					return JelBoolean.valueOf(fixedSecs == this.minSecs && value == fixedSecs);
				case '!==': 
					return JelBoolean.valueOf(fixedSecs != this.minSecs || value != fixedSecs);
				case '>':
					return JelBoolean.twoPrecision(ctx, this.typicalSecs > value, this.maxSecs > value);
				case '>>':
					return JelBoolean.valueOf(this.maxSecs > value);
				case '<':
					return JelBoolean.twoPrecision(ctx, this.typicalSecs < value, this.minSecs < value);
				case '<<':
					return JelBoolean.valueOf(this.minSecs < value);
				case '>=':
					return JelBoolean.twoPrecision(ctx, this.typicalSecs >= value, this.maxSecs >= value);
				case '>>=':
					return JelBoolean.valueOf(this.maxSecs >= value);
				case '<=':
					return JelBoolean.twoPrecision(ctx, this.typicalSecs <= value, this.minSecs <= value);
				case '<<=':
					return JelBoolean.valueOf(this.minSecs <= value);
			}
		}
		else if (right instanceof Float || right instanceof Fraction || right instanceof ApproximateNumber) {
			const r = Float.toRealNumber(right);
			switch (operator) {
				case '*':
					return new Duration(this.years * r, this.months * r, this.days * r, this.hours * r, this.minutes * r, this.seconds * r).simplify();
				case '/':
					return r ? new Duration(this.years / r, this.months / r, this.days / r, this.hours / r, this.minutes / r, this.seconds / r).simplify() : new Duration(0);
			}
		}
		return super.op(ctx, operator, right, isReversal);
	}
	
	singleOp(ctx: Context, operator: string): JelObject|Promise<JelObject> {
		if (operator == '!') {
			const s = this.simplify();
			return JelBoolean.valueOf(!(s.years || s.months || s.days || s.hours || s.minutes || s.seconds));
		}
		else if (operator == '-') 
			return this.negate();
		else
			return Runtime.singleOp(ctx, operator, this);
	}
	
	negate(): Duration {
		return new Duration(-this.years, -this.months, -this.days, -this.hours, -this.minutes, -this.seconds).simplify();
	}
	
	toEstimatedSeconds_jel_mapping: boolean;
	toEstimatedSeconds(ctx: Context): UnitValue {
		return new UnitValue(ApproximateNumber.createIfError(this.typicalSecs, Math.max(Math.abs(this.typicalSecs - this.minSecs), Math.abs(this.maxSecs - this.typicalSecs))), 'Second'); 
	}
	
	fullDays_jel_mapping: boolean;
	fullDays(): Duration {
		const dDays = Math.floor((this.hours + this.minutes / 60 + this.seconds / 3600) / 24);
		return new Duration(this.years, this.months, this.days + dDays);
	}
	
	simplify_jel_mapping: boolean;
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
			return Duration.fromUnitValue(ctx, x);
		throw new Error('Unsupported value, only Duration and second-convertible UnitValues supported');
	}

	private static minMax(ctx: Context, operator: string, args: any[]): Duration {
		if (args.length < 0)
			throw new Error('Missing parameters');
		let l = Duration.toDuration(ctx, args[0]);
		for (let d of args) {
			const dur = Duration.toDuration(ctx, d);
			if ((Runtime.op(ctx, operator, l, dur) as JelBoolean).toRealBoolean())
				l = dur;
		}
	 return l;
	}

	static min_jel_mapping = true;
	static min(ctx: Context, a: List): Duration {
			return Duration.minMax(ctx, '>', a.elements);
	}
	static max_jel_mapping = true;
	static max(ctx: Context, a: List): Duration {
			return Duration.minMax(ctx, '<', a.elements);
	}
	
	abs_jel_mapping: boolean;
	abs(): Duration {
		return new Duration(Math.abs(this.years), Math.abs(this.months), Math.abs(this.days), Math.abs(this.hours), Math.abs(this.minutes), Math.abs(this.seconds));
	}
	
	getSerializationProperties(): any[] {
		if (this.hours || this.minutes || this.seconds)
			return [this.years, this.months, this.days, this.hours, this.minutes, this.seconds];
		else 
			return [this.years, this.months, this.days];
	}
	
	toString(): string {
		return `Duration(years=${this.years} months=${this.months} days=${this.days} hours=${this.hours} minutes=${this.minutes} seconds=${this.seconds})`;
	}

	static fromUnitValue_jel_mapping = true;
	static fromUnitValue(ctx: Context, value: any): any {
    const uv = TypeChecker.instance(UnitValue, value, 'value');
    if (Float.isInteger(ctx, uv)) {
      if (uv.isType(ctx, 'Year'))
        return new Duration(Float.toRealNumber(uv));
      else if (uv.isType(ctx, 'Month'))
        return new Duration(0, Float.toRealNumber(uv));
      else if (uv.isType(ctx, 'Week'))
        return new Duration(0, 0, Float.toRealNumber(uv)*7);
      else if (uv.isType(ctx, 'Day'))
        return new Duration(0, 0, Float.toRealNumber(uv));
      else if (uv.isType(ctx, 'Hour'))
        return new Duration(0, 0, 0, Float.toRealNumber(uv));
      else if (uv.isType(ctx, 'Minute'))
        return new Duration(0, 0, 0, 0, Float.toRealNumber(uv));
    }
    if (uv.isType(ctx, 'Second'))
        return new Duration(0, 0, 0, 0, 0, Float.toRealNumber(uv));
    else 
      return Util.resolveValue(uv.convertTo(ctx, 'Second'), r=>new Duration(0, 0, 0, 0, 0, Float.toRealNumber(r)).simplify());
  }
  
	// create either with years/months/days/hours/minutes/seconds, or a UnitValue
	static create_jel_mapping = true;
	static create(ctx: Context, ...args: any[]): any {
		return new Duration(TypeChecker.realNumber(args[0], 'years', 0), TypeChecker.realNumber(args[1], 'months', 0), TypeChecker.realNumber(args[2], 'days', 0), 
												TypeChecker.realNumber(args[3], 'hours', 0), TypeChecker.realNumber(args[4], 'minutes', 0), TypeChecker.realNumber(args[5], 'seconds', 0));
	}

}

const p: any = Duration.prototype;
p.years_jel_property = true;
p.months_jel_property = true;
p.days_jel_property = true;
p.hours_jel_property = true;
p.minutes_jel_property = true;
p.seconds_jel_property = true;
p.reverseOps = JelObject.SWAP_OPS;
p.negate_jel_mapping = true;
p.abs_jel_mapping = true;
p.fullDays_jel_mapping = true;
p.simplify_jel_mapping = true;
p.toEstimatedSeconds_jel_mapping = true;

BaseTypeRegistry.register('Duration', Duration);

