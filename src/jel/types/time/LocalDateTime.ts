import * as moment from 'moment';

import Context from '../../Context';
import JelBoolean from '../JelBoolean';
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
	
  getStartTime(ctx: Context, zone: TimeZone): Timestamp {
		return null as any; // TODO
	}
	
	getEndTime(ctx: Context, zone: TimeZone): Timestamp {
		return null as any; // TODO
	}
	
	isContinous(): JelBoolean {
		return JelBoolean.TRUE;
	}
	
	op(ctx: Context, operator: string, right: any): any {
		return super.op(ctx, operator, right);
	}

	getSerializationProperties(): any[] {
		return [this.date, this.time];
	}
	
	static create_jel_mapping = {date: 1, time: 2};
	static create(ctx: Context, ...args: any[]): any {
		return new LocalDateTime(args[0], args[1]);
	}
}


