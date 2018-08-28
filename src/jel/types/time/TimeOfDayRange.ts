import * as moment from 'moment';

import JelType from '../../JelType';
import Context from '../../Context';
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
	
  getStartTime(ctx: Context, zone: TimeZone): Timestamp {
		return null as any; // TODO
	}
	
	getEndTime(ctx: Context, zone: TimeZone): Timestamp {
		return null as any; // TODO
	}
	
	isContinous(): FuzzyBoolean {
		return FuzzyBoolean.TRUE;
	}
	
	op(ctx: Context, operator: string, right: any): any {
		return super.op(ctx, operator, right);
	}

	getSerializationProperties(): any[] {
		return [this.start, this.end];
	}
	
	static create_jel_mapping = {start: 1, end: 2};
	static create(ctx: Context, ...args: any[]): any {
		return new TimeOfDayRange(args[0], args[1]);
	}
}


