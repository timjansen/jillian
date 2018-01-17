import * as moment from 'moment';

import JelType from '../../JelType';
import FuzzyBoolean from '../FuzzyBoolean';
import LocalDate from './LocalDate';
import Timestamp from './Timestamp';
import TimeSpec from './TimeSpec';
import TimeZone from './TimeZone';

/**
 * Represents a date.
 */
export default class LocalDateRange extends TimeSpec {
	
	constructor(public firstDay: LocalDate, public lastDay: LocalDate) {
		super();
	}
	
  getStartTime(zone: TimeZone): Timestamp {
		return null as any; // TODO
	}
	
	getEndTime(zone: TimeZone): Timestamp {
		return null as any; // TODO
	}
	
	isContinous(): boolean {
		return true;
	}
	
	op(operator: string, right: any): any {
		return super.op(operator, right);
	}

	getSerializationProperties(): any[] {
		return [this.firstDay, this.lastDay];
	}
	
	static create_jel_mapping = {firstDay: 0, lastDay: 1};
	static create(...args: any[]): any {
		return new LocalDateRange(args[0], args[1]);
	}
}


