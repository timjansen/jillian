import * as moment from 'moment';

import JelType from '../../JelType';
import FuzzyBoolean from '../FuzzyBoolean';
import TimeSpec from './TimeSpec';
import LocalDate from './LocalDate';
import TimeOfDay from './TimeOfDay';
import TimeZone from './TimeZone';
import Timestamp from './Timestamp';


/**
 * Represents a date.
 */
export default class LocalDateTime extends TimeSpec {
	
	constructor(public date: LocalDate, public time: TimeOfDay) {
		super();
	}
	
  getStartTime(zone: TimeZone): Timestamp {
		return null as any; // TODO
	}
	
	getEndTime(zone: TimeZone): Timestamp {
		return null as any; // TODO
	}
	
	isContinous(): FuzzyBoolean {
		return FuzzyBoolean.TRUE;
	}
	
	op(operator: string, right: any): any {
		return super.op(operator, right);
	}

	getSerializationProperties(): any[] {
		return [this.date, this.time];
	}
	
	static create_jel_mapping = {date: 0, time: 1};
	static create(...args: any[]): any {
		return new LocalDateTime(args[0], args[1]);
	}
}


