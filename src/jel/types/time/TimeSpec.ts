import JelType from '../../JelType';
import Timestamp from './Timestamp';
import TimeZone from './TimeZone';
import TimeHint from './TimeHint';

/**
 * Abstract base class that represents a time period.
 */
export default abstract class TimeSpec extends JelType {
	
	constructor() {
		super();
	}

	getStartTime_jel_mapping: Object;
	abstract getStartTime(defaultTimeZone: TimeZone): Timestamp|Promise<Timestamp|undefined>|undefined;

	getEndTime_jel_mapping: Object;
	abstract getEndTime(defaultTimeZone: TimeZone): Timestamp|Promise<Timestamp|undefined>|undefined;

	isContinous_jel_mapping: Object;
	abstract isContinous(): boolean;

	
	isBefore_jel_mapping: Object;
	isBefore(time: Timestamp, defaultTimeZone: TimeZone): boolean|Promise<boolean> {
		const t0 = this.getEndTime(defaultTimeZone);
		if (t0 instanceof Promise)
			return t0.then(tx=>(tx != undefined) && (tx.msSinceEpoch < time.msSinceEpoch));
		else
			return (t0 != undefined) && (t0.msSinceEpoch < time.msSinceEpoch);
	}
	
	isAfter_jel_mapping: Object;
	isAfter(time: Timestamp, defaultTimeZone: TimeZone): boolean|Promise<boolean> {
		const t0 = this.getStartTime(defaultTimeZone);
		if (t0 instanceof Promise)
			return t0.then(tx=>(tx != undefined) && (tx.msSinceEpoch > time.msSinceEpoch));
		else
			return (t0 != undefined) && (t0.msSinceEpoch > time.msSinceEpoch);
	}
	
	// override if TimeSpec is not continous
	contains_jel_mapping: Object;
	contains(time: Timestamp, defaultTimeZone: TimeZone): boolean|Promise<boolean> {
		const b0 = this.isAfter(time, defaultTimeZone);
		if (b0 === true)
			return false;
		const b1 = this.isBefore(time, defaultTimeZone);
		// TODO handle promise here
		return !this.isAfter(time, defaultTimeZone) && !this.isBefore(time, defaultTimeZone);
	}
	
	
}

TimeSpec.prototype.getStartTime_jel_mapping = {defaultTimeZone: 0};
TimeSpec.prototype.getEndTime_jel_mapping = {defaultTimeZone: 0};
TimeSpec.prototype.isBefore_jel_mapping = {time: 0, defaultTimeZone: 1};
TimeSpec.prototype.isAfter_jel_mapping = {time: 0, defaultTimeZone: 1};
TimeSpec.prototype.contains_jel_mapping = {time: 0, defaultTimeZone: 1};

