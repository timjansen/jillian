import JelType from '../../JelType';
import Timestamp from './Timestamp';

import * as moment from 'moment-timezone';

/**
 * Represents a time zone. 
 */
export default class TimeZone extends JelType {

	// tz: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones (e.g. "America/Anchorage" or "UTC")
	// offset: additional fixed offset
	constructor(public tz = "UTC", public offsetMinutes = 0) {
		super();
	}

	get isDST(): boolean {
		return false; // TODO
	}
	
	// returns offset in minutes
	getOffset(time: Timestamp): number {
		return null as any; // TODO
	}
	
	op(operator: string, right: any): any {
		return null; // TODO
	}

	toUTC(time: Timestamp): TimeZone {
		return null as any; // TODO
	}
	
	getSerializationProperties(): any[] {
		return [this.offsetMinutes];
	}
	
	static create_jel_mapping = {offsetMinutes: 0};
	static create(...args: any[]): any {
		return new TimeZone(args[0]);
	}
}


