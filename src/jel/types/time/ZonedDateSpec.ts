import JelType from '../../JelType';
import Timestamp from './Timestamp';
import TimeZone from './TimeZone';
import DateHint from './DateHint';
import TimeSpec from './TimeSpec';
import LocalDate from './LocalDate';
import Range from '../Range';
import ZonedDate from './ZonedDate';

/**
 * Abstract base class that represents a date period.
 */
export default abstract class ZonedDateSpec extends TimeSpec implements DateHint {
	
	constructor() {
		super();
	}
	
	containsDate(date: LocalDate): boolean|Promise<boolean> {
		return false; // TODO
	}

	getDatesForYear(year: number): LocalDate[]|Promise<Array<LocalDate>> {
		return []; // TODO
	}
	
	getYearRange(): Range|Promise<Range> { // Range of two integers
		return new Range(); // TODO
	}
	
	getStartDate_jel_mapping: Object;
	getStartDate(defaultTimeZone: TimeZone): ZonedDate|Promise<ZonedDate>|undefined {
		return null as any; // TODO
	}

	getEndDate_jel_mapping: Object;
	getEndDate(defaultTimeZone: TimeZone): ZonedDate|Promise<ZonedDate>|undefined {
		return null as any; // TODO
	}

	isBefore_jel_mapping: Object;
	isBefore(date: Timestamp|ZonedDate, defaultTimeZone: TimeZone): boolean|Promise<boolean> {
/*		const t0 = this.getEndTime(defaultTimeZone);
		if (t0 instanceof Promise)
			return t0.then(tx=>(tx != undefined) && (tx.msSinceEpoch < time.msSinceEpoch));
		else
			return (t0 != undefined) && (t0.msSinceEpoch < time.msSinceEpoch);
*/
		return null as any; // TODO
	}
	
	isAfter_jel_mapping: Object;
	isAfter(date: Timestamp|ZonedDate, defaultTimeZone: TimeZone): boolean|Promise<boolean> {
/*		const t0 = this.getStartTime(defaultTimeZone);
		if (t0 instanceof Promise)
			return t0.then(tx=>(tx != undefined) && (tx.msSinceEpoch > time.msSinceEpoch));
		else
			return (t0 != undefined) && (t0.msSinceEpoch > time.msSinceEpoch);
*/
			return null as any; // TODO
	}
	
	// override if TimeSpec is not continous
	contains(time: Timestamp|ZonedDate, defaultTimeZone: TimeZone): boolean|Promise<boolean> {
/*		const b0 = this.isAfter(time, defaultTimeZone);
		if (b0 === true)
			return false;
		const b1 = this.isBefore(time, defaultTimeZone);
		else // TODO handle promise here
		return !this.isAfter(time, defaultTimeZone) && !this.isBefore(time, defaultTimeZone);
*/	
		return null as any; // TODO
	}
	
	
}

ZonedDateSpec.prototype.getStartDate_jel_mapping = {defaultTimeZone: 0};
ZonedDateSpec.prototype.getEndDate_jel_mapping = {defaultTimeZone: 0};

