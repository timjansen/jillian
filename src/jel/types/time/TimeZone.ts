import JelObject from '../../JelObject';
import Context from '../../Context';
import Timestamp from './Timestamp';
import JelBoolean from '../JelBoolean';
import TypeChecker from '../TypeChecker';
import NativeJelObject from '../NativeJelObject';
import Class from '../Class';
import BaseTypeRegistry from '../../BaseTypeRegistry';

import * as moment from 'moment-timezone';
import MomentZone = moment.MomentZone;

/**
 * Represents a time zone. 
 */
export default class TimeZone extends NativeJelObject {
  static clazz: Class|undefined;

  static UTC_jel_property = true;
	static UTC = new TimeZone();

  tz_jel_property: boolean;

	// tz: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones (e.g. "America/Anchorage" or "UTC")
	constructor(public tz = "UTC") {
		super('TimeZone');
	}
  
  get clazz(): Class {
    return TimeZone.clazz!;
  }
	
	private getMomentZone(): MomentZone {
		return moment.tz.zone(this.tz);
	}
	
	isDST_jel_mapping: boolean;
	isDST(ctx: Context, time: Timestamp): JelBoolean {
		return JelBoolean.valueOf(time.toMoment().tz(this.tz).isDST());
	}
	
	// returns offset in minutes
	getOffset_jel_mapping: boolean;
	getOffset(ctx: Context, time: Timestamp): number {
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
	
	op(ctx: Context, operator: string, right: JelObject, isReversal: boolean = false): JelObject|Promise<JelObject> {
		if (right instanceof TimeZone) {
			switch (operator) {
				case '===':
					return JelBoolean.valueOf(this.tz === right.tz); // matches if same zone name used
				case '==':
					return JelBoolean.valueOf(TimeZone.isIdenticalZone(this.getMomentZone(), right.getMomentZone())); // matches if zones are identical, even if names are different
			}
		}
		return super.op(ctx, operator, right, isReversal);
	}

	getSerializationProperties(): any[] {
		return [this.tz];
	}
	
	static create_jel_mapping: any = ['tz'];
	static create(ctx: Context, ...args: any[]): any {
		return new TimeZone(TypeChecker.realString(args[0], 'tz', 'UTC'));
	}
}

TimeZone.prototype.tz_jel_property = true;
TimeZone.prototype.isDST_jel_mapping = true;
TimeZone.prototype.getOffset_jel_mapping = true;

BaseTypeRegistry.register('TimeZone', TimeZone);

