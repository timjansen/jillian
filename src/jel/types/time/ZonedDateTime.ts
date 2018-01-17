import * as moment from 'moment';

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
	
	op(operator: string, right: any): any {
		return super.op(operator, right);
	}

	getSerializationProperties(): any[] {
		return [this.timeZone, this.date, this.time, this.milliseconds];
	}
	
	static create_jel_mapping = {timeZone: 0, date: 1, time: 2, milliseconds: 3};
	static create(...args: any[]): any {
		return new ZonedDateTime(args[0], args[1], args[2], args[3]);
	}
}


