import * as moment from 'moment-timezone';
import Moment = moment.Moment;

import Util from '../../../util/Util';
import Runtime from '../../Runtime';
import JelObject from '../../JelObject';
import Context from '../../Context';
import JelNumber from '../JelNumber';
import UnitValue from '../UnitValue';
import JelBoolean from '../JelBoolean';
import Timestamp from './Timestamp';
import LocalDateTime from './LocalDateTime';
import ZonedDateTime from './ZonedDateTime';
import ZonedDate from './ZonedDate';
import TimeZone from './TimeZone';
import Duration from './Duration';
import TimeOfDay from './TimeOfDay';
import AbstractDate from './AbstractDate';
import TypeChecker from '../TypeChecker';

/**
 * Represents a year, month or day
 */
export default class LocalDate extends AbstractDate {
	// month: 1-12
	// day: 1-31
	constructor(public year: number, public month: number | null = null, public day: number | null = null) {
		super();
	}
	
  getStartTime(ctx: Context, timeZone: any): Timestamp {
		return Timestamp.fromMoment(this.toMomentTz(TypeChecker.instance(TimeZone, timeZone, 'timeZone').tz));
	}
	
	getEndTime(ctx: Context, timeZone: any): Timestamp {
		const m = this.toMomentTz(TypeChecker.instance(TimeZone, timeZone, 'timeZone').tz);
		const m2 = this.month == null ? m.add(1, 'year') : (this.day == null ? m.add(1, 'month') : m.add(1, 'day'));
		return Timestamp.fromMoment(m2); 	
	}
	
	toMoment(): Moment {
		return moment([this.year, this.month==null?0:this.month-1, this.day||1]);
	}
	toMomentTz(tz: string): Moment {
		return moment.tz([this.year, this.month==null?0:this.month-1, this.day||1], tz);
	}

	
	simplify_jel_mapping: Object;
	simplify(): LocalDate {
		if (this.isValid() || this.month == null)
			return this;

		if (this.day == null) {
			return new LocalDate(this.year + Math.trunc((this.month-1)/12), this.month - Math.trunc((this.month-1)/12)*12);
		}
			
		const day = this.day == null ? 1 : this.day;
		const month = this.month == null ? 1 : this.month;
		
		let y = this.year + Math.trunc((month-1)/12);
		let m0 = (month - 1) % 12;
		let day0 = day - 1;
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
		if (y === this.year && m0+1 === this.month && day0+1 === this.day)
			return this;
		else
			return new LocalDate(y, m0+1, day0+1);
	}
	
	private simplifyNoNull(): LocalDate {
		const d = this.simplify();
		if (d.month == null || d.day == null)
			return new LocalDate(d.year, d.month || 1, d.day || 1);
		else
			return d;
	}
	
	
	op(ctx: Context, operator: string, right: JelObject): JelObject|Promise<JelObject> {
		if (right instanceof LocalDate) {
			switch (operator) {
				case '==':
					return JelBoolean.valueOf(this.year == right.year && 
																		(this.month == null || right.month == null || this.month == right.month) && 
																		(this.day == null || right.day == null || this.day == right.day));
				case '===':
					return JelBoolean.valueOf(this.year === right.year && this.month === right.month && this.day === right.day);
				case '>>':
				case '>': {
					const l = this.simplify(), r = right.simplify();
					return JelBoolean.valueOf(l.year * 1000 + (l.month||1) * 50 + (l.day||1) > r.year * 1000 + (r.month||1) * 50 + (r.day||1));
				}
				case '>=':
					return JelBoolean.truest(ctx, this.op(ctx, '==', right) as JelBoolean, this.op(ctx, '>', right) as JelBoolean);
				case '<=':
					return JelBoolean.truest(ctx, this.op(ctx, '==', right) as JelBoolean, (this.op(ctx, '>', right) as JelBoolean).negate());
				case '-': {
					return this.duration(ctx, right);
				}
			}
		}
		else if (right instanceof LocalDateTime) {
			return new LocalDateTime(this, TimeOfDay.MIDNIGHT).op(ctx, operator, right);
		}
		else if (right instanceof Duration) {
			switch (operator) {
				case '+':
					const d = right.fullDays();
					return new LocalDate(this.year + d.years, (this.month||1) + d.months, (this.day||1) + d.days).simplify();
				case '-':
					const dm = (right.singleOp(ctx, '-') as Duration).fullDays();
					return new LocalDate(this.year + dm.years, (this.month||1) + dm.months, (this.day||1) + dm.days).simplify();
			}
		}
		else if (right instanceof UnitValue) {
			switch (operator) {
				case '+':
				case '-':
					if (right.isType(ctx, 'Year') && JelNumber.isInteger(ctx, right))
						return this.op(ctx, operator, new Duration(JelNumber.toRealNumber(right)));
					else if (right.isType(ctx, 'Month') && JelNumber.isInteger(ctx, right))
						return this.op(ctx, operator, new Duration(0, JelNumber.toRealNumber(right)));
					else
						return Util.resolveValue(right.convertTo(ctx, 'Day'), days=>this.op(ctx, operator, new Duration(0,0,JelNumber.toRealNumber(days))));
			}
		}
		
		return super.op(ctx, operator, right);
	}

	toZonedDate_jel_mapping: Object;
	toZonedDate(ctx: Context, timeZone: any): ZonedDate {
		return new ZonedDate(TypeChecker.instance(TimeZone, timeZone, 'timeZone'), this);
	}

	toZonedDateTime_jel_mapping: Object;
	toZonedDateTime(ctx: Context, timeZone: any, time = TimeOfDay.MIDNIGHT): ZonedDateTime {
		return new ZonedDateTime(TypeChecker.instance(TimeZone, timeZone, 'timeZone'), this, time);
	}

	toTimestamp_jel_mapping: Object;
	toTimestamp(ctx: Context, timeZone: any, time = TimeOfDay.MIDNIGHT): Timestamp {
		return this.toZonedDateTime(TypeChecker.instance(TimeZone, timeZone, 'timeZone'), time).toTimestamp(ctx);
	}
	
	toLocalDateTime_jel_mapping: Object;
	toLocalDateTime(ctx: Context, time: any = TimeOfDay.MIDNIGHT): LocalDateTime {
		return new LocalDateTime(this, TypeChecker.instance(TimeOfDay, time, 'time'));
	}
	

	duration(ctx: Context, right: LocalDate): Duration {
		const l = this.simplifyNoNull(), r = right.simplifyNoNull();
		if (l.year * 1000 + l.month! * 50 + l.day! < r.year * 1000 + r.month! * 50 + r.day!)
			return r.duration(ctx, l).negate();

		const mDiff = (l.year! * 12 + l.month!)-(r.year! * 12 + r.month!);
		if (l.day! >= r.day!)
			return new Duration(Math.trunc((mDiff)/12), (mDiff)%12, l.day!-r.day!);
		else
			return new Duration(Math.trunc((mDiff-1)/12), (mDiff-1)%12, l.day!+this.getMonth0Duration(r.year!, r.month!-1)-r.day!);
	}
	
	getSerializationProperties(): any[] {
		return [this.year, this.month, this.day];
	}
	
	static create_jel_mapping: any = {year: 1, month: 2, day: 3};
	static create(ctx: Context, ...args: any[]): any {
		return new LocalDate(TypeChecker.realNumber(args[0], 'year', 0), TypeChecker.optionalRealNumber(args[1], 'month'), TypeChecker.optionalRealNumber(args[2], 'day')).simplify();
	}
}

LocalDate.prototype.JEL_PROPERTIES = AbstractDate.prototype.JEL_PROPERTIES;
LocalDate.prototype.simplify_jel_mapping = {};
LocalDate.prototype.reverseOps = {'+': 1};
LocalDate.prototype.toZonedDate_jel_mapping = {timeZone: 1, time: 2};
LocalDate.prototype.toZonedDateTime_jel_mapping = {timeZone: 1, time: 2};
LocalDate.prototype.toTimestamp_jel_mapping = {timeZone: 1, time: 2};
LocalDate.prototype.toLocalDateTime_jel_mapping = {time: 1};


