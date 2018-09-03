import * as moment from 'moment';

import Context from '../../Context';
import LocalDateTime from './LocalDateTime';
import LocalDate from './LocalDate';
import TimeOfDay from './TimeOfDay';
import Timestamp from './Timestamp';
import TimeZone from './TimeZone';
import FuzzyBoolean from '../FuzzyBoolean';

/**
 * Represents a date.
 */
export default class ZonedDateTime extends LocalDateTime {
	
	constructor(public timeZone: TimeZone, date: LocalDate, time: TimeOfDay, public milliseconds = 0) {
		super(date, time);
	}
	
	getStartTime(): Timestamp {
		return null as any; // TODO
	}
	
	getEndTime(): Timestamp {
		return null as any; // TODO
	}
	
	op(ctx: Context, operator: string, right: any): any {
		return super.op(ctx, operator, right);
	}

	getSerializationProperties(): any[] {
		return [this.timeZone, this.date, this.time, this.milliseconds];
	}
	
	static create_jel_mapping = {timeZone: 1, date: 2, time: 3, milliseconds: 4};
	static create(ctx: Context, ...args: any[]): any {
		return new ZonedDateTime(args[0], args[1], args[2], args[3]);
	}
}

