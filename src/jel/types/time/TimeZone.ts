import JelType from '../../JelType';
import Context from '../../Context';
import Timestamp from './Timestamp';
import FuzzyBoolean from '../FuzzyBoolean';

import * as moment from 'moment-timezone';
import MomentZone = moment.MomentZone;

/**
 * Represents a time zone. 
 */
export default class TimeZone extends JelType {
	static UTC = new TimeZone();
	static JEL_PROPERTIES: Object = {UTC: 1};

	JEL_PROPERTIES: Object;
	
	// tz: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones (e.g. "America/Anchorage" or "UTC")
	// offset: additional fixed offset
	constructor(public tz = "UTC") {
		super();
	}
	
	private getMomentZone(): MomentZone {
		return moment.tz.zone(this.tz);
	}
	
	isDST_jel_mapping: Object;
	isDST(time: Timestamp): FuzzyBoolean {
		return FuzzyBoolean.toFuzzyBoolean(time.toMoment().tz(this.tz).isDST());
	}
	
	// returns offset in minutes
	getOffset_jel_mapping: Object;
	getOffset(time: Timestamp): number {
		return this.getMomentZone().utcOffset(time.msSinceEpoch);
	}
	
	private static isIdenticalZone(zone1: MomentZone, zone2: MomentZone): boolean {
		if (zone1.name == zone2.name)
			return true;
		if (zone1.untils.length != zone2.untils.length && zone1.offsets.length != zone2.offsets.length)
			return false;
		for (let i = 0; i < zone1.untils.length; i++)
			if (zone1.untils[i] != zone2.untils[i] || zone1.offsets[i] != zone2.offsets[i])
				return false;
		return true;
	}
	
	op(ctx: Context, operator: string, right: any): any {
		if (right instanceof TimeZone) {
			switch (operator) {
				case '===':
					return FuzzyBoolean.toFuzzyBoolean(this.tz === right.tz); // matches if same zone name used
				case '==':
					return FuzzyBoolean.toFuzzyBoolean(TimeZone.isIdenticalZone(this.getMomentZone(), right.getMomentZone())); // matches if zones are identical, even if names are different
			}
		}
		return super.op(ctx, operator, right);
	}

	getSerializationProperties(): any[] {
		return [this.tz];
	}
	
	static create_jel_mapping: any = {tz: 0};
	static create(...args: any[]): any {
		return new TimeZone(args[0]);
	}
}

TimeZone.prototype.JEL_PROPERTIES = {tz: 1};
TimeZone.prototype.isDST_jel_mapping = {time: 0};
TimeZone.prototype.getOffset_jel_mapping = {time: 0};
