import * as moment from 'moment';

import Timestamp from './Timestamp';
import TimeZone from './TimeZone';
import TimeSpec from './TimeSpec';
import FuzzyBoolean from '../FuzzyBoolean';

/**
 * Represents a date.
 */
export default class ZonedDate extends TimeSpec {
	
	constructor(public timeZone: TimeZone, public year: number, public month: number, public day: number) {
		super();
	}
	
  getStartTime(): Timestamp {
		return Timestamp.fromMoment(moment({year: this.year, month: this.month, day: this.day}).tz(this.timeZone.tz));
	}
	
	getEndTime(): Timestamp {
		return Timestamp.fromMoment(moment({year: this.year, month: this.month, day: this.day}).tz(this.timeZone.tz).add(1, 'd'));
	}
	
	isContinous(): FuzzyBoolean {
		return FuzzyBoolean.TRUE;
	}
	
	op(operator: string, right: any): any {
		return super.op(operator, right);
	}

	getSerializationProperties(): any[] {
		return [this.timeZone, this.year, this.month, this.day];
	}
	
	static create_jel_mapping = {timeZone: 0, year: 1, month: 2, day: 3};
	static create(...args: any[]): any {
		return new ZonedDate(args[0], args[1], args[2], args[3]);
	}
}


