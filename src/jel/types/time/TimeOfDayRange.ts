import * as moment from 'moment';

import JelType from '../../JelType';
import FuzzyBoolean from '../FuzzyBoolean';
import TimeOfDay from './TimeOfDay';
import Timestamp from './Timestamp';
import TimeSpec from './TimeSpec';
import TimeZone from './TimeZone';

/**
 * Represents a date.
 */
export default class TimeOfDayRange extends TimeSpec {
	
	// start is inclusive, end is exclusive
	constructor(public start: TimeOfDay, public end: TimeOfDay) {
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
		return [this.start, this.end];
	}
	
	static create_jel_mapping = {start: 0, end: 1};
	static create(...args: any[]): any {
		return new TimeOfDayRange(args[0], args[1]);
	}
}


