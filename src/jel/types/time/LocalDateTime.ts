import * as moment from 'moment';

import Util from '../../../util/Util';
import Context from '../../Context';
import JelBoolean from '../JelBoolean';
import JelNumber from '../JelNumber';
import UnitValue from '../UnitValue';
import TimeSpec from './TimeSpec';
import LocalDate from './LocalDate';
import TimeOfDay from './TimeOfDay';
import TimeZone from './TimeZone';
import Timestamp from './Timestamp';
import Duration from './Duration';


/**
 * Represents a date.
 */
export default class LocalDateTime extends TimeSpec {
	
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

  getStartTime(ctx: Context, zone: TimeZone): Timestamp {
		return null as any; // TODO
	}
	
	getEndTime(ctx: Context, zone: TimeZone): Timestamp {
		return null as any; // TODO
	}
	
	isContinous(): JelBoolean {
		return JelBoolean.TRUE;
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

//		else if (right instanceof ZonedDate) {
//			return this.toZonedDate(right.timeZone).op(ctx, operator, right);
//		}
//		else if (right instanceof ZonedDateTime) {
//			return this.toZonedDateTime(right.timeZone).op(ctx, operator, right);
//		}
		return super.op(ctx, operator, right);
	}

	getSerializationProperties(): any[] {
		return [this.date, this.time];
	}
	
	static create_jel_mapping = {date: 1, time: 2};
	static create(ctx: Context, ...args: any[]): any {
		if (args[0] instanceof LocalDate)
			return new LocalDateTime(args[0], args[1]);
		else 
			return new LocalDateTime(new LocalDate(JelNumber.toRealNumber(args[0]), JelNumber.toOptionalRealNumber(args[1], null), JelNumber.toOptionalRealNumber(args[2], null)), 
															new TimeOfDay(JelNumber.toRealNumber(args[3]), JelNumber.toOptionalRealNumber(args[4], null), JelNumber.toOptionalRealNumber(args[5], null)));
	}
}

LocalDateTime.prototype.JEL_PROPERTIES = {time: 1, date: 1, year:1, month:1, day: 1, hour:1, minute: 1, seconds:1};
LocalDateTime.prototype.reverseOps = {'+': 1};

