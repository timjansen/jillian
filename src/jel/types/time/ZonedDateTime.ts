import * as moment from 'moment-timezone';
import Moment = moment.Moment;

import Context from '../../Context';
import Runtime from '../../Runtime';
import JelObject from '../../JelObject';
import LocalDateTime from './LocalDateTime';
import LocalDate from './LocalDate';
import ZonedDate from './ZonedDate';
import TimeOfDay from './TimeOfDay';
import Timestamp from './Timestamp';
import TimeZone from './TimeZone';
import AbstractDate from './AbstractDate';
import Duration from './Duration';
import UnitValue from '../UnitValue';
import JelBoolean from '../JelBoolean';
import TypeChecker from '../TypeChecker';

/**
 * Represents a date.
 */
export default class ZonedDateTime extends AbstractDate {
	
	constructor(public timeZone: TimeZone, public date: LocalDate, public time: TimeOfDay, public milliseconds = 0) {
		super();
		if (milliseconds >= 1000 || milliseconds < 0)
			throw new Error('Milliseconds must be between 0 and 1000.');
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

	toMoment(): Moment {
		return this.toMomentTz(this.timeZone.tz);
	}
	toMomentTz(tz: string): Moment {
		return moment.tz([this.year, this.month?this.month-1:0, this.day||1, this.hour, this.minute || 0, this.seconds || 0, this.milliseconds], tz);
	}
  toDate(year: number, month: number, day: number): AbstractDate {
    return new LocalDate(year, month, day);
  }
  
	static fromMoment(m: Moment, timeZone: TimeZone): ZonedDateTime {
		return new ZonedDateTime(timeZone, new LocalDate(m.year(), m.month()+1, m.date()), new TimeOfDay(m.hour(), m.minute(), m.seconds()), m.milliseconds());
	}
	
	getStartTime(ctx: Context, timeZone: any): Timestamp {
		return Timestamp.fromMoment(this.toMomentTz((TypeChecker.optionalInstance(TimeZone, timeZone, 'timeZone') || this.timeZone).tz));
	}
	
	getEndTime(ctx: Context, timeZone: any): Timestamp {
		const m = this.toMomentTz((TypeChecker.optionalInstance(TimeZone, timeZone, 'timeZone') || this.timeZone).tz);
		const m2 = this.minute == null ? m.add(1, 'hour') : (this.seconds == null ? m.add(1, 'minute') : m.add(1, 'second'));
		return Timestamp.fromMoment(m2);
	}

	isContinous(): JelBoolean {
		return JelBoolean.TRUE;
	}

	op(ctx: Context, operator: string, right: any): any {
		if (right instanceof ZonedDateTime) {
			if (this.timeZone.tz == right.timeZone.tz) 
				return this.toLocalDateTime().op(ctx, operator, right.toLocalDateTime());
			else {
				if (operator == '===')
					return JelBoolean.FALSE;
				else if (operator == '!==')
					return JelBoolean.TRUE;
				return this.toUTC().toLocalDateTime().op(ctx, operator, right.toUTC().toLocalDateTime());
			}
		}
		if (right instanceof ZonedDate)
			return this.op(ctx, operator, right.toZonedDateTime(ctx));
		else if (right instanceof LocalDate)
			return this.toLocalDateTime().op(ctx, operator, right.toLocalDateTime(ctx));
		else if (right instanceof LocalDateTime)
			return this.op(ctx, operator, right.toZonedDateTime(ctx, this.timeZone));
		else if (right instanceof Timestamp)
			return this.toTimestamp(ctx).op(ctx, operator, right);
		else if (right instanceof Duration || right instanceof UnitValue) {
			switch (operator) {
				case '+':
				case '-':
					const lt = new LocalDateTime(this.date, this.time).op(ctx, operator, right);
					return new ZonedDateTime(this.timeZone, lt.date, lt.time);
			}
		}
		return super.op(ctx, operator, right);
	}

	opReversed(ctx: Context, operator: string, left: JelObject): JelObject|Promise<JelObject> {
		if (left instanceof LocalDate) {
			switch (operator) {
				case '+': 
				case '-': 
					return Runtime.op(ctx, operator, left, this.date);
			}
		}
		else if (left instanceof LocalDateTime) {
			switch (operator) {
				case '+': 
				case '-': 
					return Runtime.op(ctx, operator, left.date, this.date);
			}
		}
		return super.opReversed(ctx, operator, left);
	}
	
	toUTC_jel_mapping: Object;
	toUTC(): ZonedDateTime {
		return ZonedDateTime.fromMoment(this.toMoment().utc(), TimeZone.UTC);
	}

	withTimeZone_jel_mapping: Object;
	withTimeZone(ctx: Context, timeZone: TimeZone): ZonedDateTime {
		return ZonedDateTime.fromMoment(this.toMoment().tz(timeZone.tz), timeZone);
	}
	
	toZonedDate_jel_mapping: Object;
	toZonedDate(): ZonedDate {
		return new ZonedDate(this.timeZone, this.date);
	}

	toLocalDateTime_jel_mapping: Object;
	toLocalDateTime(): LocalDateTime {
		return new LocalDateTime(this.date, this.time);
	}

	toTimestamp_jel_mapping: Object;
	toTimestamp(ctx: Context): Timestamp {
		return Timestamp.fromMoment(this.toMomentTz(this.timeZone.tz));
	}

	
	getSerializationProperties(): any[] {
		return [this.timeZone, this.date, this.time, this.milliseconds];
	}
	
	static create_jel_mapping = {timeZone: 1, date: 2, time: 3, year: 2, month: 3, day: 4, hour: 5, minute: 6, seconds: 7, milliseconds: 8};
	static create(ctx: Context, ...args: any[]): any {
		if (args[0] instanceof ZonedDate)
			return new ZonedDateTime(args[0].timeZone, args[0].date, TypeChecker.instance(TimeOfDay, args[1], 'time'), TypeChecker.realNumber(args[7]||args[2], 'milliseconds', 0));
		else if (args[1] instanceof LocalDate)
			return new ZonedDateTime(TypeChecker.instance(TimeZone, args[0], 'timeZone'), TypeChecker.instance(LocalDate, args[1], 'date'), TypeChecker.instance(TimeOfDay, args[2], 'time'), TypeChecker.realNumber(args[7]||args[3], 'milliseconds', 0));
		else
			return new ZonedDateTime(TypeChecker.instance(TimeZone, args[0], 'timeZone'), LocalDate.create(ctx, args[1], args[2], args[3]), TimeOfDay.create(ctx, args[4], args[5], args[6]), TypeChecker.realNumber(args[7], 'milliseconds', 0));
	}
}

ZonedDateTime.prototype.reverseOps = JelObject.SWAP_OPS;
ZonedDateTime.prototype.JEL_PROPERTIES = Object.assign({time: 1, date: 1, timeZone: 1, hour:1, minute: 1, seconds:1}, AbstractDate.prototype.JEL_PROPERTIES);
ZonedDateTime.prototype.toZonedDate_jel_mapping = [];
ZonedDateTime.prototype.toLocalDateTime_jel_mapping = [];
ZonedDateTime.prototype.toTimestamp_jel_mapping = [];
ZonedDateTime.prototype.toUTC_jel_mapping = [];
ZonedDateTime.prototype.withTimeZone_jel_mapping = ['timeZone'];

