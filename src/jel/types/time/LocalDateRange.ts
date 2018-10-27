import * as moment from 'moment';

import JelObject from '../../JelObject';
import Context from '../../Context';
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
	
  getStartTime(ctx: Context, zone: TimeZone): Timestamp {
		return null as any; // TODO
	}
	
	getEndTime(ctx: Context, zone: TimeZone): Timestamp {
		return null as any; // TODO
	}
	
	isContinous(): FuzzyBoolean {
		return FuzzyBoolean.TRUE;
	}
	
	op(ctx: Context, operator: string, right: JelObject): JelObject|Promise<JelObject> {
		return super.op(ctx, operator, right);
	}

	getSerializationProperties(): any[] {
		return [this.firstDay, this.lastDay];
	}
	
	static create_jel_mapping = {firstDay: 1, lastDay: 2};
	static create(ctx: Context, ...args: any[]): any {
		return new LocalDateRange(args[0], args[1]);
	}
}


