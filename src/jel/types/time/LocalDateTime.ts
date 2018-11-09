import * as moment from 'moment-timezone';
import Moment = moment.Moment;

import Util from '../../../util/Util';
import Context from '../../Context';
import JelBoolean from '../JelBoolean';
import JelNumber from '../JelNumber';
import UnitValue from '../UnitValue';
import TypeChecker from '../TypeChecker';
import AbstractDate from './AbstractDate';
import LocalDate from './LocalDate';
import TimeOfDay from './TimeOfDay';
import TimeZone from './TimeZone';
import ZonedDate from './ZonedDate';
import ZonedDateTime from './ZonedDateTime';
import Timestamp from './Timestamp';
import Duration from './Duration';


/**
 * Represents a date.
 */
export default class LocalDateTime extends AbstractDate {
	
	constructor(public date: LocalDate, public time: TimeOfDay) {
		super();
		
		if (date.month == null || date.day == null)
			throw new Error('A LocalDateTime must not have month or day set to null. Use a LocalDate if you need this.');
	}
	
	get year(): number {
		return this.date.year;
	}
	get month(): number {
		return this.date.month!;
	}
	get day(): number {
		return this.date.day!;
	}

	get hour(): number {
		return this.time.hour;
	}
	get minute(): number | null {
		return this.time.minute;
	}
	get seconds(): number | null {
		return this.time.seconds;
	}

  getStartTime(ctx: Context, timeZone: any): Timestamp {
		return Timestamp.fromMoment(this.toMoment());
	}
	
	getEndTime(ctx: Context, timeZone: any): Timestamp {
		const m = this.toMomentTz(TypeChecker.instance(TimeZone, timeZone, 'timeZone').tz);
		const m2 = this.minute == null ? m.add(1, 'hour') : (this.seconds == null ? m.add(1, 'minute') : m.add(1, 'second'));
		return Timestamp.fromMoment(m2); 
	}
	
	toMoment(): Moment {
		return moment([this.year, this.month-1, this.day, this.hour, this.minute||0, this.seconds||0]);
	}
	
	toMomentTz(tz: string): Moment {
		return moment.tz([this.year, this.month-1, this.day, this.hour, this.minute||0, this.seconds||0], tz);
	}
	
	op(ctx: Context, operator: string, right: any): any {
		if (right instanceof LocalDateTime) {
			switch(operator) {
				case '==':
				case '===':
					return JelBoolean.and(ctx, this.date.op(ctx, operator, right.date), this.time.op(ctx, operator, right.time));
				case '!=':
				case '!==':
					return JelBoolean.or(ctx, this.date.op(ctx, operator, right.date), this.time.op(ctx, operator, right.time));

				case '>':
				case '>>':
				case '<':
				case '<<':
				case '>=':
				case '>>=':
				case '<=':
				case '<<=':
					return JelBoolean.or(ctx, this.date.op(ctx, operator, right.date), JelBoolean.and(ctx, this.date.op(ctx, '==', right.date), this.time.op(ctx, operator, right.time)));
					
				case '-':
					return (this.date.op(ctx, operator, right.date) as any).op(ctx, '+', this.time.op(ctx, operator, right.time));
			}
		}
		else if (right instanceof LocalDate) {
			return this.op(ctx, operator, new LocalDateTime(right, TimeOfDay.MIDNIGHT));
		}
		else if (right instanceof Duration) {
			switch (operator) {
				case '+':
				case '-':
					const d = right.simplify();
					const dayDur = new Duration(d.years, d.months, d.days);
					const subDayDur = new Duration(0, 0, 0, d.hours, d.minutes, d.seconds);
					return new LocalDateTime(this.date.op(ctx, operator, dayDur) as any, this.time.op(ctx, operator, subDayDur) as any);
			}			
		}
		else if (right instanceof UnitValue) {
			switch (operator) {
				case '+':
				case '-':
					if (JelNumber.isInteger(ctx, right.value)) {
						if (right.isType(ctx, 'Year'))
							return this.op(ctx, operator, new Duration(JelNumber.toRealNumber(right)));
						else if (right.isType(ctx, 'Month'))
							return this.op(ctx, operator, new Duration(0, JelNumber.toRealNumber(right)));
						else if (right.isType(ctx, 'Day'))
							return this.op(ctx, operator, new Duration(0, 0, JelNumber.toRealNumber(right)));
						else if (right.isType(ctx, 'Hour'))
							return this.op(ctx, operator, new Duration(0, 0, 0, JelNumber.toRealNumber(right)));
						else if (right.isType(ctx, 'Minute'))
							return this.op(ctx, operator, new Duration(0, 0, 0, 0, JelNumber.toRealNumber(right)));
						else
							return Util.resolveValue(right.convertTo(ctx, 'Second'), seconds=>this.op(ctx, operator, new Duration(0,0,0, 0,0,JelNumber.toRealNumber(seconds))));
					}
					else
						return Util.resolveValue(right.convertTo(ctx, 'Second'), seconds=>this.op(ctx, operator, new Duration(0,0,0, 0,0,JelNumber.toRealNumber(seconds))));
			}
		}
		return super.op(ctx, operator, right);
	}
	
	toZonedDate_jel_mapping: Object;
	toZonedDate(ctx: Context, timeZone: any): ZonedDate {
		return new ZonedDate(TypeChecker.instance(TimeZone, timeZone, 'timeZone'), this.date);
	}

	
	toZonedDateTime_jel_mapping: Object;
	toZonedDateTime(ctx: Context, timeZone: any): ZonedDateTime {
		return new ZonedDateTime(TypeChecker.instance(TimeZone, timeZone, 'timeZone'), this.date, this.time);
	}

	toTimestamp_jel_mapping: Object;
	toTimestamp(ctx: Context, timeZone: any): Timestamp {
		return this.getStartTime(ctx, TypeChecker.instance(TimeZone, timeZone, 'timeZone'));
	}

	getSerializationProperties(): any[] {
		return [this.date, this.time];
	}

	static create_jel_mapping = {date: 1, time: 2, year: 1, month: 2, day: 3, hour: 4, minute: 5, seconds: 6};
	static create(ctx: Context, ...args: any[]): any {
		if (args[0] instanceof LocalDate)
			return new LocalDateTime(args[0], TypeChecker.instance(TimeOfDay, args[1], 'time'));
		else 
			return new LocalDateTime(new LocalDate(TypeChecker.realNumber(args[0], 'year'), TypeChecker.realNumber(args[1], 'month'), TypeChecker.realNumber(args[2], 'day')), 
															new TimeOfDay(TypeChecker.realNumber(args[3], 'hour'), TypeChecker.optionalRealNumber(args[4], 'minute'), TypeChecker.optionalRealNumber(args[5], 'seconds')));
	}
}

LocalDateTime.prototype.JEL_PROPERTIES = Object.assign({time: 1, date: 1, hour:1, minute: 1, seconds:1}, AbstractDate.prototype.JEL_PROPERTIES);
LocalDateTime.prototype.reverseOps = {'+': 1};
LocalDateTime.prototype.toZonedDate_jel_mapping = {timeZone: 1};
LocalDateTime.prototype.toZonedDateTime_jel_mapping = {timeZone: 1};
LocalDateTime.prototype.toTimestamp_jel_mapping = {timeZone: 1};
