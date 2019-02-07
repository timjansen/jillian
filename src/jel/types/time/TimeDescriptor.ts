import JelObject from '../../JelObject';
import Context from '../../Context';
import Timestamp from './Timestamp';
import TimeZone from './TimeZone';
import JelBoolean from '../JelBoolean';
import TypeChecker from '../TypeChecker';
import Util from '../../../util/Util';
import NativeJelObject from '../NativeJelObject';
import Class from '../Class';
import BaseTypeRegistry from '../../BaseTypeRegistry';


/**
 * Abstract base class that represents a time period.
 */
export default abstract class TimeDescriptor extends NativeJelObject {
	
	constructor(className: string) {
		super(className);
	}

	getStartTime_jel_mapping: boolean;
	abstract getStartTime(ctx: Context, defaultTimeZone: any): Timestamp|Promise<Timestamp|undefined>|undefined;

	getEndTime_jel_mapping: boolean;
	abstract getEndTime(ctx: Context, defaultTimeZone: any): Timestamp|Promise<Timestamp|undefined>|undefined;

	isContinous_jel_mapping: boolean;
	abstract isContinous(): JelBoolean;

	
	isBefore_jel_mapping: boolean;
	isBefore(ctx: Context, time0: any, defaultTimeZone0: any): JelBoolean|Promise<JelBoolean> {
		const time: Timestamp = TypeChecker.instance(Timestamp, time0, 'time');
		const defaultTimeZone: TimeZone = TypeChecker.instance(TimeZone, defaultTimeZone0, 'defaultTimeZone');
		
		const t0 = this.getEndTime(ctx, defaultTimeZone);
		if (t0 instanceof Promise)
			return t0.then(tx=>JelBoolean.valueOf((tx != undefined) && (tx.msSinceEpoch < time.msSinceEpoch)));
		else
			return JelBoolean.valueOf((t0 != undefined) && (t0.msSinceEpoch < time.msSinceEpoch));
	}
	
	isAfter_jel_mapping: boolean;
	isAfter(ctx: Context, time0: any, defaultTimeZone0: any): JelBoolean|Promise<JelBoolean> {
		const time: Timestamp = TypeChecker.instance(Timestamp, time0, 'time');
		const defaultTimeZone: TimeZone = TypeChecker.instance(TimeZone, defaultTimeZone0, 'defaultTimeZone');
		
		const t0 = this.getStartTime(ctx, defaultTimeZone);
		if (t0 instanceof Promise)
			return t0.then(tx=>JelBoolean.valueOf((tx != undefined) && (tx.msSinceEpoch > time.msSinceEpoch)));
		else
			return JelBoolean.valueOf((t0 != undefined) && (t0.msSinceEpoch > time.msSinceEpoch));
	}
	
	// override if TimeDescriptor is not continous
	contains_jel_mapping: boolean;
	contains(ctx: Context, time0: any, defaultTimeZone0: any): JelBoolean|Promise<JelBoolean> {
		const time: Timestamp = TypeChecker.instance(Timestamp, time0, 'time');
		const defaultTimeZone: TimeZone = TypeChecker.instance(TimeZone, defaultTimeZone0, 'defaultTimeZone');
		
		const a: JelBoolean|Promise<JelBoolean> = this.isAfter(ctx, time, defaultTimeZone);
		if (a instanceof JelBoolean && a.toRealBoolean())
			return JelBoolean.FALSE;
		return Util.resolveValues((a1: JelBoolean, b1: JelBoolean)=>a1.or(ctx, b1).negate(), a, this.isBefore(ctx, time, defaultTimeZone));
	}
	
}

TimeDescriptor.prototype.getStartTime_jel_mapping = true;
TimeDescriptor.prototype.getEndTime_jel_mapping = true;
TimeDescriptor.prototype.isBefore_jel_mapping = true;
TimeDescriptor.prototype.isAfter_jel_mapping = true;
TimeDescriptor.prototype.isContinous_jel_mapping = true;
TimeDescriptor.prototype.contains_jel_mapping = true;

