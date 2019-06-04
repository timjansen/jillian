import * as moment from 'moment-timezone';
import Moment = moment.Moment;

import Context from '../../Context';
import Runtime from '../../Runtime';
import JelObject from '../../JelObject';
import Timestamp from './Timestamp';
import TimeOfDay from './TimeOfDay';
import TimeZone from './TimeZone';
import AbstractDate from './AbstractDate';
import Duration from './Duration';
import UnitValue from '../UnitValue';
import LocalDate from './LocalDate';
import LocalDateTime from './LocalDateTime';
import ZonedDateTime from './ZonedDateTime';
import JelBoolean from '../JelBoolean';
import TypeChecker from '../TypeChecker';
import Class from '../Class';
import BaseTypeRegistry from '../../BaseTypeRegistry';

/**
 * Represents a date.
 */
export default class ZonedDate extends AbstractDate {
  static clazz: Class|undefined;

	
	constructor(public timeZone: TimeZone, public date: LocalDate) {
		super('ZonedDate');
	}
  
  get clazz(): Class {
    return ZonedDate.clazz!;
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

	getStartTime(ctx: Context): Timestamp {
		return this.date.getStartTime(ctx, this.timeZone);
	}
	
	getEndTime(ctx: Context): Timestamp {
		return this.date.getEndTime(ctx, this.timeZone);
	}
	
	toMoment(): Moment {
		return moment.tz([this.year, this.month?this.month-1:0, this.day||1], this.timeZone.tz);
	}
	toMomentTz(tz: string): Moment {
		return moment.tz([this.year, this.month?this.month-1:0, this.day||1], tz);
	}
  toDate(year: number, month: number, day: number): AbstractDate {
    return new LocalDate(year, month, day);
  }
	
	toZonedDateTime_jel_mapping: boolean;
	toZonedDateTime(ctx: Context, time: any = TimeOfDay.MIDNIGHT): ZonedDateTime {
		return new ZonedDateTime(this.timeZone, this.date, TypeChecker.instance(TimeOfDay, time, 'time'));
	}
	
	toUTC_jel_mapping: boolean;
	toUTC(ctx: Context): ZonedDate {
		return this.withTimeZone(ctx, TimeZone.UTC);
	}

	withTimeZone_jel_mapping: boolean;
	withTimeZone(ctx: Context, timeZone: TimeZone): ZonedDate {
		return new ZonedDate(timeZone, this.date);
	}
	
	op(ctx: Context, operator: string, right: any, isReversal: boolean = false): any {
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
		return super.op(ctx, operator, right, isReversal);
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
	
  static fromLocalDate_jel_mapping = true;
	static fromLocalDate(ctx: Context, timeZone: any, date: any): ZonedDate {
		return new ZonedDate(TypeChecker.instance(TimeZone, timeZone, 'timeZone'), TypeChecker.instance(LocalDate, date, 'date'));
  }

	static create_jel_mapping = true;
	static create(ctx: Context, ...args: any[]): any {
		return new ZonedDate(TypeChecker.instance(TimeZone, args[0], 'timeZone'), LocalDate.create(ctx, args[1], args[2], args[3]));
	}
}

const p: any = ZonedDate.prototype;
p.timeZone_jel_property = true;
p.reverseOps = JelObject.SWAP_OPS;
p.toZonedDateTime_jel_mapping = true;
p.toUTC_jel_mapping = true;
p.withTimeZone_jel_mapping = true;

BaseTypeRegistry.register('ZonedDate', ZonedDate);

