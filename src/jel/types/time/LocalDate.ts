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
import TimeOfDay from './TimeOfDay';
import TimeSpec from './TimeSpec';
import TimeZone from './TimeZone';
import Duration from './Duration';

/**
 * Represents a year, month or day
 */
export default class LocalDate extends TimeSpec {
	static readonly MONTHS_MAX_DURATION = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	
	// month: 1-12
	// day: 1-31
	constructor(public year: number, public month: number | null = null, public day: number | null = null) {
		super();
	}
	
  getStartTime(ctx: Context, zone: TimeZone): Timestamp {
		return Timestamp.fromMoment(moment({year: this.year, month: this.month||1, day: this.day||1}).tz(zone.tz));
	}
	
	getEndTime(ctx: Context, zone: TimeZone): Timestamp {
		return Timestamp.fromMoment(moment({year: this.year, month: this.month||12, day: this.day||this.getMonth0Duration(this.year, this.month||12)}).tz(zone.tz).add(1, 'd'));
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

	get dayOfYear(): number {
		let md = 0;
		const m = this.month || 1;
		for (let i = 1; i < m; i++)
			md += this.getMonth0Duration(this.year, i-1);
		return md + (this.day || 1);
	}
	
	isValid(): boolean {
		return (this.month != null ? (this.month >= 1 && this.month <= 12) : this.day == null) && 
						(this.day == null || (this.day >= 1 && this.day <= this.getMonth0Duration(this.year, this.month!-1)));
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
					return this.diff(ctx, right);
				}
			}
		}
		else if (right instanceof LocalDateTime) {
			return new LocalDateTime(this, TimeOfDay.MIDNIGHT).op(ctx, operator, right);
		}
//		else if (right instanceof ZonedDate) {
//			return this.toZonedDate(right.timeZone).op(ctx, operator, right);
//		}
//		else if (right instanceof ZonedDateTime) {
//			return this.toZonedDateTime(right.timeZone).op(ctx, operator, right);
//		}
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

//	toZonedDate(timeZone: TimeZone): ZonedDate {
//		return new ZonedDate(timeZone, this.year, this.month, this.day);
//	}

//	toZonedDateTime(timeZone: TimeZone, time = TimeOfDay.MIDNIGHT): ZonedDateTime {
//		return new ZonedDateTime(timeZone, this, time);
//	}
	
	toLocalDateTime(time = TimeOfDay.MIDNIGHT): LocalDateTime {
		return new LocalDateTime(this, time);
	}
	

	diff(ctx: Context, right: LocalDate): Duration {
		const l = this.simplifyNoNull(), r = right.simplifyNoNull();
		if (l.year * 1000 + l.month! * 50 + l.day! < r.year * 1000 + r.month! * 50 + r.day!)
			return r.diff(ctx, l).negate();

		const mDiff = (l.year! * 12 + l.month!)-(r.year! * 12 + r.month!);
		if (l.day! >= r.day!)
			return new Duration(Math.trunc((mDiff)/12), (mDiff)%12, l.day!-r.day!);
		else
			return new Duration(Math.trunc((mDiff-1)/12), (mDiff-1)%12, l.day!+this.getMonth0Duration(r.year!, r.month!-1)-r.day!);
	}
	
	getSerializationProperties(): any[] {
		return [this.year, this.month, this.day];
	}
	
	static create_jel_mapping: any = {date: 1, time: 2, year: 1, month: 2, day: 3, hour: 4, minute: 5, seconds: 6};
	static create(ctx: Context, ...args: any[]): any {
		return new LocalDate(JelNumber.toRealNumber(args[0], 0), JelNumber.toOptionalRealNumber(args[1], null), JelNumber.toOptionalRealNumber(args[2], null)).simplify();
	}
}

LocalDate.prototype.JEL_PROPERTIES = {year:1, month:1, day: 1, dayOfYear: 1};
LocalDate.prototype.simplify_jel_mapping = {};
LocalDate.prototype.reverseOps = {'+': 1};

