import JelObject from '../../JelObject';
import Context from '../../Context';
import UnitValue from '../UnitValue';
import JelBoolean from '../JelBoolean';
import Float from '../Float';
import ApproximateNumber from '../ApproximateNumber';
import TimeDescriptor from './TimeDescriptor';
import ZonedDateTime from './ZonedDateTime';
import TimeZone from './TimeZone';
import LocalDateTime from './LocalDateTime';
import LocalDate from './LocalDate';
import TimeOfDay from './TimeOfDay';
import TypeChecker from '../TypeChecker';
import Util from '../../../util/Util';
import * as moment from 'moment-timezone';
import Moment = moment.Moment;

/**
 * Represents a timestamp, relative to epoch.
 */
export default class Timestamp extends TimeDescriptor {
	
	
	constructor(public msSinceEpoch: number, public precisionInMs = 0) {
		super();
	}
	
	private couldBeEqual(other: Timestamp): boolean {
		return Math.abs(this.msSinceEpoch - other.msSinceEpoch) <= (this.precisionInMs + other.precisionInMs);
	}
	
	op(ctx: Context, operator: string, right: JelObject): JelObject|Promise<JelObject> {
		if (right instanceof Timestamp) {
			switch (operator) {
				case '===':
					return JelBoolean.valueOf(this.msSinceEpoch === right.msSinceEpoch);
				case '!==':
					return JelBoolean.valueOf(this.msSinceEpoch !== right.msSinceEpoch);
				case '==':
					return JelBoolean.twoPrecision(ctx, this.couldBeEqual(right), this.msSinceEpoch === right.msSinceEpoch);
				case '!=':
					return JelBoolean.twoPrecision(ctx, !this.couldBeEqual(right), this.msSinceEpoch !== right.msSinceEpoch);
				
				case '>>':
					return JelBoolean.valueOf(this.msSinceEpoch > right.msSinceEpoch);
				case '<<':
					return JelBoolean.valueOf(this.msSinceEpoch < right.msSinceEpoch);
				case '>':
					return JelBoolean.fourWay(ctx, this.msSinceEpoch > right.msSinceEpoch, !this.couldBeEqual(right));
				case '<':
					return JelBoolean.fourWay(ctx, this.msSinceEpoch < right.msSinceEpoch, !this.couldBeEqual(right));

				case '>>=':
					return JelBoolean.valueOf(this.msSinceEpoch >= right.msSinceEpoch);
				case '<<=':
					return JelBoolean.valueOf(this.msSinceEpoch <= right.msSinceEpoch);
				case '>=':
					return JelBoolean.fourWay(ctx, this.msSinceEpoch >= right.msSinceEpoch, !this.couldBeEqual(right));
				case '<=':
					return JelBoolean.fourWay(ctx, this.msSinceEpoch <= right.msSinceEpoch, !this.couldBeEqual(right));

				case '-':
					return new UnitValue((this.precisionInMs == 0 && right.precisionInMs == 0) ? 
															 		Float.valueOf(this.msSinceEpoch - right.msSinceEpoch) : new ApproximateNumber(Float.valueOf(this.msSinceEpoch - right.msSinceEpoch), Float.valueOf(this.precisionInMs + right.precisionInMs)), 
															 'Millisecond');
			}
		}
		else if (right instanceof UnitValue) {
			return Util.resolveValue(right.convertTo(ctx, 'Millisecond'), (v: any)=> {
				switch (operator) {
					case '+':
						return new Timestamp(this.msSinceEpoch + Float.toRealNumber(v), this.precisionInMs);
					case '-':
						return new Timestamp(this.msSinceEpoch - Float.toRealNumber(v), this.precisionInMs);
					case '+-':
						return new Timestamp(this.msSinceEpoch, Float.toRealNumber(v));
				}
				return super.op(ctx, operator, right);
			});
		}
		else if (right instanceof Float) {
			switch (operator) {
				case '+':
					return new Timestamp(this.msSinceEpoch + right.value, this.precisionInMs);
				case '-':
					return new Timestamp(this.msSinceEpoch - right.value, this.precisionInMs);
				case '+-':
					return new Timestamp(this.msSinceEpoch, right.value);
			}
		}
		return super.op(ctx, operator, right);
	}
	
	opReversed(ctx: Context, operator: string, left: JelObject): JelObject|Promise<JelObject> {
		if (left instanceof UnitValue) {
			return Util.resolveValue(left.convertTo(ctx, 'Millisecond'), (v: any)=> {
				switch (operator) {
					case '+':
						return new Timestamp(Float.toRealNumber(v) + this.msSinceEpoch, this.precisionInMs);
					case '-':
						return new Timestamp(Float.toRealNumber(v) - this.msSinceEpoch, this.precisionInMs);
				}
				return super.opReversed(ctx, operator, left);
			});
		}
		else if (left instanceof Float) {
			switch (operator) {
				case '+':
					return new Timestamp(left.value + this.msSinceEpoch, this.precisionInMs);
				case '-':
					return new Timestamp(left.value - this.msSinceEpoch, this.precisionInMs);
			}
		}
		return super.opReversed(ctx, operator, left);
	}
	
	getStartTime(ctx: Context, defaultTimeZone: any): Timestamp {
		return this;
	}

	getEndTime(ctx: Context, defaultTimeZone: any): Timestamp {
		return this;
	}

	isContinous(): JelBoolean {
		return JelBoolean.TRUE;
	}

	toNumber_jel_mapping: Object;
	toNumber(): number {
		return this.msSinceEpoch;
	}
	
	toZonedDateTime_jel_mapping: Object;
	toZonedDateTime(ctx: Context, timeZone: any): ZonedDateTime {
		const m = moment(this.msSinceEpoch).tz(TypeChecker.instance(TimeZone, timeZone, 'timeZone').tz);
		return new ZonedDateTime(timeZone, new LocalDate(m.year(), m.month()+1, m.date()), new TimeOfDay(m.hour(), m.minute(), m.second()), m.milliseconds());
	}

	toLocalDateTime_jel_mapping: Object;
	toLocalDateTime(ctx: Context, timeZone: any): LocalDateTime {
		const m = moment(this.msSinceEpoch).tz(TypeChecker.instance(TimeZone, timeZone, 'timeZone').tz);
		return new LocalDateTime(new LocalDate(m.year(), m.month()+1, m.date()), new TimeOfDay(m.hour(), m.minute(), m.second()));
	}
	
	toLocalDate_jel_mapping: Object;
	toLocalDate(ctx: Context, timeZone: any): LocalDate {
		const m = moment(this.msSinceEpoch).tz(TypeChecker.instance(TimeZone, timeZone, 'tz').tz);
		return new LocalDate(m.year(), m.month()+1, m.date());
	}

	toMoment(): Moment {
		return moment(this.msSinceEpoch);
	}
	
	getSerializationProperties(): any[] {
		return [this.msSinceEpoch, this.precisionInMs];
	}
	
	static fromMoment(m: Moment): Timestamp {
		return new Timestamp(m.valueOf());
	}
	
	static create_jel_mapping = ['msSinceEpoch', 'precisionInMs'];
	static create(ctx: Context, ...args: any[]): any {
		return new Timestamp(TypeChecker.realNumber(args[0], 'msSinceEpoch'), TypeChecker.realNumber(args[1], 'precisionInMs', 0));
	}
}

Timestamp.prototype.JEL_PROPERTIES = {msSinceEpoch:1, precisionInMs:1};
Timestamp.prototype.reverseOps = {'-':1, '+': 1};

Timestamp.prototype.toNumber_jel_mapping = [];
Timestamp.prototype.toZonedDateTime_jel_mapping = ['timeZone'];
Timestamp.prototype.toLocalDateTime_jel_mapping = ['timeZone'];
Timestamp.prototype.toLocalDate_jel_mapping = ['timeZone'];


