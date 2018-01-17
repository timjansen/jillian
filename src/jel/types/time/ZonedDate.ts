import * as moment from 'moment';

import LocalDate from './LocalDate';
import Timestamp from './Timestamp';
import TimeZone from './TimeZone';
import FuzzyBoolean from '../FuzzyBoolean';

/**
 * Represents a date.
 */
export default class ZonedDate extends LocalDate {
	
	constructor(public timeZone: TimeZone, year: number, month: number, day: number) {
		super(year, month, day);
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
		return [this.timeZone, this.year, this.month, this.day];
	}
	
	static create_jel_mapping = {msSinceEpoch: 0, precisionInMs: 1};
	static create(...args: any[]): any {
		return new Timestamp(args[0], args[1]);
	}
}


