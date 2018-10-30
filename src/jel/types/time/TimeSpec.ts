import JelObject from '../../JelObject';
import Context from '../../Context';
import Timestamp from './Timestamp';
import TimeZone from './TimeZone';
import TimeHint from './TimeHint';
import JelBoolean from '../JelBoolean';
import Util from '../../../util/Util';


/**
 * Abstract base class that represents a time period.
 */
export default abstract class TimeSpec extends JelObject {
	
	constructor() {
		super();
	}

	getStartTime_jel_mapping: Object;
	abstract getStartTime(ctx: Context, defaultTimeZone: TimeZone): Timestamp|Promise<Timestamp|undefined>|undefined;

	getEndTime_jel_mapping: Object;
	abstract getEndTime(ctx: Context, defaultTimeZone: TimeZone): Timestamp|Promise<Timestamp|undefined>|undefined;

	isContinous_jel_mapping: Object;
	abstract isContinous(): JelBoolean;

	
	isBefore_jel_mapping: Object;
	isBefore(ctx: Context, time: Timestamp, defaultTimeZone: TimeZone): JelBoolean|Promise<JelBoolean> {
		const t0 = this.getEndTime(ctx, defaultTimeZone);
		if (t0 instanceof Promise)
			return t0.then(tx=>JelBoolean.valueOf((tx != undefined) && (tx.msSinceEpoch < time.msSinceEpoch)));
		else
			return JelBoolean.valueOf((t0 != undefined) && (t0.msSinceEpoch < time.msSinceEpoch));
	}
	
	isAfter_jel_mapping: Object;
	isAfter(ctx: Context, time: Timestamp, defaultTimeZone: TimeZone): JelBoolean|Promise<JelBoolean> {
		const t0 = this.getStartTime(ctx, defaultTimeZone);
		if (t0 instanceof Promise)
			return t0.then(tx=>JelBoolean.valueOf((tx != undefined) && (tx.msSinceEpoch > time.msSinceEpoch)));
		else
			return JelBoolean.valueOf((t0 != undefined) && (t0.msSinceEpoch > time.msSinceEpoch));
	}
	
	// override if TimeSpec is not continous
	contains_jel_mapping: Object;
	contains(ctx: Context, time: Timestamp, defaultTimeZone: TimeZone): JelBoolean|Promise<JelBoolean> {
		const a: JelBoolean|Promise<JelBoolean> = this.isAfter(ctx, time, defaultTimeZone);
		if (a instanceof JelBoolean && a.toRealBoolean())
			return JelBoolean.FALSE;
		return Util.resolveValues((a1: JelBoolean, b1: JelBoolean)=>a1.or(ctx, b1).negate(), a, this.isBefore(ctx, time, defaultTimeZone));
	}
	
	
}

TimeSpec.prototype.getStartTime_jel_mapping = {defaultTimeZone: 1};
TimeSpec.prototype.getEndTime_jel_mapping = {defaultTimeZone: 1};
TimeSpec.prototype.isBefore_jel_mapping = {time: 1, defaultTimeZone: 2};
TimeSpec.prototype.isAfter_jel_mapping = {time: 1, defaultTimeZone: 2};
TimeSpec.prototype.isContinous_jel_mapping = {};
TimeSpec.prototype.contains_jel_mapping = {time: 1, defaultTimeZone: 2};

