import * as moment from 'moment-timezone';
import Moment = moment.Moment;

import Runtime from '../../Runtime';
import JelObject from '../../JelObject';
import Context from '../../Context';
import JelBoolean from '../JelBoolean';
import Timestamp from './Timestamp';
import LocalDateTime from './LocalDateTime';
import ZonedDateTime from './ZonedDateTime';
import ZonedDate from './ZonedDate';
import TimeOfDay from './TimeOfDay';
import TimeSpec from './TimeSpec';
import TimeZone from './TimeZone';
import Duration from './Duration';

/**
 * Represents a date.
 */
export default class LocalDate extends TimeSpec {
	static readonly MONTHS_MAX_DURATION = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	
	// month: 1-12
	// day: 1-31
	constructor(public year: number, public month: number, public day: number) {
		super();
	}
	
  getStartTime(ctx: Context, zone: TimeZone): Timestamp {
		return Timestamp.fromMoment(moment({year: this.year, month: this.month, day: this.day}).tz(zone.tz));
	}
	
	getEndTime(ctx: Context, zone: TimeZone): Timestamp {
		return Timestamp.fromMoment(moment({year: this.year, month: this.month, day: this.day}).tz(zone.tz).add(1, 'd'));
	}
	
	isContinous(): JelBoolean {
		return JelBoolean.TRUE;
	}

		// m0: 0-11
	private getMonth0Duration(year: number, m0: number) {
		if (m0 != 1)
			return LocalDate.MONTHS_MAX_DURATION[m0];
		else 
			return moment([year]).isLeapYear() ? 29 : 28;
	}
	
	isValid_jel_mapping: Object;
	isValid(): boolean {
		return this.month >= 1 && this.month <= 12 && this.day >= 1 && this.day <= this.getMonth0Duration(this.year, this.month-1);
	}
	
	simplify_jel_mapping: Object;
	simplify(): LocalDate {
		let y = this.year + Math.floor((this.month-1)/12);
		let m0 = (this.month - 1) % 12;
		let day0 = this.day - 1;
		while  (m0 < 0) {
			y--;
			m0 += 12;
		}
		while (day0 < 0) {
			if (m0)
				m0--;
			else {
				y--;
				m0 += 12;
			}		
			day0 += this.getMonth0Duration(y, m0);
		}
		while (day0 > 27) {
			const d = this.getMonth0Duration(y, m0);
			if (day0 < d)
				break;
			day0 -= d;
			m0++;
			if (m0 == 11) {
				y++;
				m0 = 0;
			}
		}
		if (y == this.year && m0+1 == this.month && day0+1 == this.day)
			return this;
		else
			return new LocalDate(y, m0+1, day0+1);
	}
	
	
	op(ctx: Context, operator: string, right: JelObject): JelObject|Promise<JelObject> {
		if (right instanceof LocalDate) {
			switch (operator) {
				case '==':
				case '>':
					return this.simplify().op(ctx, Runtime.STRICT_OPS[operator], right.simplify());
				case '===':
					return JelBoolean.valueOf(this.year == right.year && this.month == right.month && this.day == right.day);
				case '>>':
					return JelBoolean.valueOf(this.year > right.year || (this.year == right.year && ((this.month > right.month) || this.month == right.month && this.day > right.day)));
			}
		}
		else if (right instanceof LocalDateTime) {
			return new LocalDateTime(this, TimeOfDay.MIDNIGHT).op(ctx, operator, right);
		}
		else if (right instanceof ZonedDate) {
			return this.toZonedDate(right.timeZone).op(ctx, operator, right);
		}
		else if (right instanceof ZonedDateTime) {
			return this.toZonedDateTime(right.timeZone).op(ctx, operator, right);
		}
		else if (right instanceof Duration) {
			switch (operator) {
				case '+':
					const d = right.fullDays();
					return new LocalDate(this.year + d.years, this.month + d.months, this.day + d.days);
				case '-':
					const dm = (right.singleOp(ctx, '-') as Duration).fullDays();
					return new LocalDate(this.year + dm.years, this.month + dm.months, this.day + dm.days);
			}
		}
		
		return super.op(ctx, operator, right);
	}

	toZonedDate(timeZone: TimeZone): ZonedDate {
		return new ZonedDate(timeZone, this.year, this.month, this.day);
	}

	toZonedDateTime(timeZone: TimeZone, time = TimeOfDay.MIDNIGHT): ZonedDateTime {
		return new ZonedDateTime(timeZone, this, time);
	}
	
	toLocalDateTime(time = TimeOfDay.MIDNIGHT): LocalDateTime {
		return new LocalDateTime(this, time);
	}

	
	getSerializationProperties(): any[] {
		return [this.year, this.month, this.day];
	}
	
	static create_jel_mapping: any = {year: 1, month: 2, day: 3};
	static create(ctx: Context, ...args: any[]): any {
		return new LocalDate(args[0], args[1], args[2]);
	}
}

LocalDate.prototype.isValid_jel_mapping = {};
LocalDate.prototype.simplify_jel_mapping = {};

