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
import NativeJelObject from '../NativeJelObject';
import Class from '../Class';
import BaseTypeRegistry from '../../BaseTypeRegistry';
import SourcePosition from '../../SourcePosition';
import RuntimeError from '../../RuntimeError';

/**
 * Represents a date.
 */
export default class ZonedDateTime extends AbstractDate {
  static clazz: Class|undefined;


	constructor(public timeZone: TimeZone, public date: LocalDate, public time: TimeOfDay, public milliseconds = 0) {
		super('ZonedDateTime');
		if (milliseconds >= 1000 || milliseconds < 0)
			throw new Error('Milliseconds must be between 0 and 1000.');
	}
  
  get clazz(): Class {
    return ZonedDateTime.clazz!;
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

  static fromLocalDate_jel_mapping = true;
	static fromLocalDate(ctx: Context, timeZone: any, date: any, time: any, milliseconds: any): ZonedDateTime {
		return new ZonedDateTime(TypeChecker.instance(TimeZone, timeZone, 'timeZone'), TypeChecker.instance(LocalDate, date, 'date'), TypeChecker.instance(TimeOfDay, time, 'time'), TypeChecker.realNumber(milliseconds, 'milliseconds', 0));
  }

  static fromZonedDate_jel_mapping = true;
	static fromZonedDate(ctx: Context, date: any, time: any, milliseconds: any): ZonedDateTime {
		return new ZonedDateTime(TypeChecker.instance(ZonedDate, date, 'date').timeZone, TypeChecker.instance(ZonedDate, date, 'date').date, TypeChecker.instance(TimeOfDay, time, 'time'), TypeChecker.realNumber(milliseconds, 'milliseconds', 0));
  }

  
	static create_jel_mapping = true;
	static create(ctx: Context, ...args: any[]): any {
		return new ZonedDateTime(TypeChecker.instance(TimeZone, args[0], 'timeZone'), LocalDate.create(ctx, args[1], args[2], args[3]), TimeOfDay.create(ctx, args[4], args[5], args[6]), TypeChecker.realNumber(args[7], 'milliseconds', 0));
	}
}

const p: any = ZonedDateTime.prototype;
p.reverseOps = JelObject.SWAP_OPS;
p.time_jel_property = true;
p.date_jel_property = true;
p.timeZone_jel_property = true;
p.hour_jel_property = true;
p.minute_jel_property = true;
p.seconds_jel_property = true;
p.toZonedDate_jel_mapping = true;
p.toLocalDateTime_jel_mapping = true;
p.toTimestamp_jel_mapping = true;
p.toUTC_jel_mapping = true;
p.withTimeZone_jel_mapping = true;

BaseTypeRegistry.register('ZonedDateTime', ZonedDateTime);
