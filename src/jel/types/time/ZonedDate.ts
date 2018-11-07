import * as moment from 'moment';

import Context from '../../Context';
import Timestamp from './Timestamp';
import TimeZone from './TimeZone';
import LocalDate from './LocalDate';
import TimeSpec from './TimeSpec';
import JelBoolean from '../JelBoolean';
import TypeChecker from '../TypeChecker';

/**
 * Represents a date.
 */
export default class ZonedDate extends TimeSpec {
	
	constructor(public timeZone: TimeZone, public date: LocalDate) {
		super();
	}
	
  getStartTime(ctx: Context): Timestamp {
		return this.date.getStartTime(ctx, this.timeZone);
	}
	
	getEndTime(ctx: Context): Timestamp {
		return this.date.getEndTime(ctx, this.timeZone);
	}
	
	isContinous(): JelBoolean {
		return JelBoolean.TRUE;
	}
	
	op(ctx: Context, operator: string, right: any): any {
		return super.op(ctx, operator, right);
	}

	getSerializationProperties(): any[] {
		return [this.timeZone, this.date];
	}
	
	static create_jel_mapping = {timeZone: 1, date: 2, year: 2, month: 3, day: 4};
	static create(ctx: Context, ...args: any[]): any {
		if (args[1] instanceof LocalDate)
			return new ZonedDate(args[0], args[1]);
		else
			return new ZonedDate(args[0], LocalDate.create(ctx, args[1], args[2], args[3]));
	}
}


