import * as moment from 'moment-timezone';
import Moment = moment.Moment;

import Context from '../../Context';
import Runtime from '../../Runtime';
import JelObject from '../../JelObject';
import Timestamp from './Timestamp';
import TimeOfDay from './TimeOfDay';
import TimeZone from './TimeZone';
import TimeDescriptor from './TimeDescriptor';
import Duration from './Duration';
import UnitValue from '../UnitValue';
import LocalDate from './LocalDate';
import LocalDateTime from './LocalDateTime';
import ZonedDateTime from './ZonedDateTime';
import JelBoolean from '../JelBoolean';
import TypeChecker from '../TypeChecker';

/**
 * Represents a date.
 */
export default class ZonedDate extends TimeDescriptor {
	
	constructor(public timeZone: TimeZone, public date: LocalDate) {
		super();
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
	get dayOfYear(): number {
		return this.date.dayOfYear;
	}
	
  getStartTime(ctx: Context): Timestamp {
		return this.date.getStartTime(ctx, this.timeZone);
	}
	
	getEndTime(ctx: Context): Timestamp {
		return this.date.getEndTime(ctx, this.timeZone);
	}
	
	toZonedDateTime_jel_mapping: Object;
	toZonedDateTime(ctx: Context, time: any = TimeOfDay.MIDNIGHT): ZonedDateTime {
		return new ZonedDateTime(this.timeZone, this.date, TypeChecker.instance(TimeOfDay, time, 'time'));
	}
	
	toUTC_jel_mapping: Object;
	toUTC(ctx: Context): ZonedDate {
		return this.withTimeZone(ctx, TimeZone.UTC);
	}

	withTimeZone_jel_mapping: Object;
	withTimeZone(ctx: Context, timeZone: TimeZone): ZonedDate {
		return new ZonedDate(timeZone, this.date);
	}
	
	isContinous(): JelBoolean {
		return JelBoolean.TRUE;
	}
	
	op(ctx: Context, operator: string, right: any): any {
		if (right instanceof ZonedDate) {
			switch (operator) {
				case '===':
					return this.timeZone.tz == right.timeZone.tz ? Runtime.op(ctx, operator, this.date, right.date) : JelBoolean.FALSE;
				case '!==':
					return this.timeZone.tz !== right.timeZone.tz ? JelBoolean.TRUE : Runtime.op(ctx, operator, this.date, right.date);
				default:
					if (this.timeZone.tz == right.timeZone.tz)
						return Runtime.op(ctx, operator, this.date, right.date);
					else
						return Runtime.op(ctx, operator, this.toZonedDateTime(ctx), right.toZonedDateTime(ctx));
			}
		}
		else if (right instanceof LocalDate)
			return Runtime.op(ctx, operator, this.date, right);
		else if (right instanceof Duration || right instanceof UnitValue) {
			switch (operator) {
				case '+':
				case '-':
					return new ZonedDate(this.timeZone, Runtime.op(ctx, operator, this.date, right) as LocalDate);
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
	
	getSerializationProperties(): any[] {
		return [this.timeZone, this.date];
	}
	
	static create_jel_mapping = {timeZone: 1, date: 2, year: 2, month: 3, day: 4};
	static create(ctx: Context, ...args: any[]): any {
		if (args[1] instanceof LocalDate)
			return new ZonedDate(TypeChecker.instance(TimeZone, args[0], 'timeZone'), TypeChecker.instance(LocalDate, args[1], 'date'));
		else
			return new ZonedDate(TypeChecker.instance(TimeZone, args[0], 'timeZone'), LocalDate.create(ctx, args[1], args[2], args[3]));
	}
}

ZonedDate.prototype.reverseOps = JelObject.SWAP_OPS;
ZonedDate.prototype.JEL_PROPERTIES = {year:1, month:1, day: 1, dayOfYear: 1, timeZone: 1, date: 1};
ZonedDate.prototype.toZonedDateTime_jel_mapping = {time: 1};
ZonedDate.prototype.toUTC_jel_mapping = {};
ZonedDate.prototype.withTimeZone_jel_mapping = {timeZone: 1};
