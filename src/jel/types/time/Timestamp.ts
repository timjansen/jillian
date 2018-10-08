import JelType from '../../JelType';
import Context from '../../Context';
import UnitValue from '../UnitValue';
import FuzzyBoolean from '../FuzzyBoolean';
import ApproximateNumber from '../ApproximateNumber';
import TimeSpec from './TimeSpec';
import ZonedDateTime from './ZonedDateTime';
import TimeZone from './TimeZone';
import LocalDateTime from './LocalDateTime';
import LocalDate from './LocalDate';
import TimeOfDay from './TimeOfDay';
import Util from '../../../util/Util';
import * as moment from 'moment-timezone';
import Moment = moment.Moment;

/**
 * Represents a timestamp, relative to epoch.
 */
export default class Timestamp extends TimeSpec {
	
	
	constructor(public msSinceEpoch: number, public precisionInMs = 0) {
		super();
	}
	
	private couldBeEqual(other: Timestamp): boolean {
		return Math.abs(this.msSinceEpoch - other.msSinceEpoch) <= (this.precisionInMs + other.precisionInMs);
	}
	
	op(ctx: Context, operator: string, right: any): any {
		if (right instanceof Timestamp) {
			switch (operator) {
				case '===':
					return FuzzyBoolean.toFuzzyBoolean(this.msSinceEpoch === right.msSinceEpoch);
				case '!==':
					return FuzzyBoolean.toFuzzyBoolean(this.msSinceEpoch !== right.msSinceEpoch);
				case '==':
					return FuzzyBoolean.twoPrecision(this.couldBeEqual(right), this.msSinceEpoch === right.msSinceEpoch);
				case '!=':
					return FuzzyBoolean.twoPrecision(!this.couldBeEqual(right), this.msSinceEpoch !== right.msSinceEpoch);
				
				case '>>':
					return FuzzyBoolean.toFuzzyBoolean(this.msSinceEpoch > right.msSinceEpoch);
				case '<<':
					return FuzzyBoolean.toFuzzyBoolean(this.msSinceEpoch < right.msSinceEpoch);
				case '>':
					return FuzzyBoolean.fourWay(this.msSinceEpoch > right.msSinceEpoch, !this.couldBeEqual(right));
				case '<':
					return FuzzyBoolean.fourWay(this.msSinceEpoch < right.msSinceEpoch, !this.couldBeEqual(right));

				case '>>=':
					return FuzzyBoolean.toFuzzyBoolean(this.msSinceEpoch >= right.msSinceEpoch);
				case '<<=':
					return FuzzyBoolean.toFuzzyBoolean(this.msSinceEpoch <= right.msSinceEpoch);
				case '>=':
					return FuzzyBoolean.fourWay(this.msSinceEpoch >= right.msSinceEpoch, !this.couldBeEqual(right));
				case '<=':
					return FuzzyBoolean.fourWay(this.msSinceEpoch <= right.msSinceEpoch, !this.couldBeEqual(right));
					
				case '-':
					return new UnitValue((this.precisionInMs == 0 && right.precisionInMs == 0) ? 
															 		this.msSinceEpoch - right.msSinceEpoch : new ApproximateNumber(this.msSinceEpoch - right.msSinceEpoch, this.precisionInMs + right.precisionInMs), 
															 'Millisecond');
			}
		}
		else if (right instanceof UnitValue) {
			return Util.resolveValue(right.convertTo(ctx, 'Millisecond'), (v: any)=> {
				switch (operator) {
					case '+':
						return new Timestamp(this.msSinceEpoch + v.value, this.precisionInMs);
					case '-':
						return new Timestamp(this.msSinceEpoch - v.value, this.precisionInMs);
					case '+-':
						return new Timestamp(this.msSinceEpoch, v.value);
				}
				return super.op(ctx, operator, right);
			});
		}
		else if (typeof right == 'number') {
			switch (operator) {
				case '+':
					return new Timestamp(this.msSinceEpoch + right, this.precisionInMs);
				case '-':
					return new Timestamp(this.msSinceEpoch - right, this.precisionInMs);
				case '+-':
					return new Timestamp(this.msSinceEpoch, right);
			}
		}
		return super.op(ctx, operator, right);
	}
	
	opReversed(ctx: Context, operator: string, left: any): any {
		if (left instanceof UnitValue) {
			return Util.resolveValue(left.convertTo(ctx, 'Millisecond'), (v: any)=> {
				switch (operator) {
					case '+':
						return new Timestamp(v.value + this.msSinceEpoch, this.precisionInMs);
					case '-':
						return new Timestamp(v.value - this.msSinceEpoch, this.precisionInMs);
				}
				return super.opReversed(ctx, operator, left);
			});
		}
		else if (typeof left == 'number') {
			switch (operator) {
				case '+':
					return new Timestamp(left + this.msSinceEpoch, this.precisionInMs);
				case '-':
					return new Timestamp(left - this.msSinceEpoch, this.precisionInMs);
			}
		}
		return super.opReversed(ctx, operator, left);
	}
	
	getStartTime(ctx: Context, defaultTimeZone: TimeZone): Timestamp {
		return this;
	}

	getEndTime(ctx: Context, defaultTimeZone: TimeZone): Timestamp {
		return this;
	}

	isContinous(): FuzzyBoolean {
		return FuzzyBoolean.TRUE;
	}

	toNumber_jel_mapping: Object;
	toNumber(): number {
		return this.msSinceEpoch;
	}
	
	toZonedDateTime_jel_mapping: Object;
	toZonedDateTime(ctx: Context, tz: TimeZone): ZonedDateTime {
		const m = moment(this.msSinceEpoch).tz(tz.tz);
		return new ZonedDateTime(tz, new LocalDate(m.year(), m.month(), m.date()), new TimeOfDay(m.hour(), m.minute(), m.second()), m.milliseconds());
	}

	toLocalDateTime_jel_mapping: Object;
	toLocalDateTime(ctx: Context, tz: TimeZone): LocalDateTime {
		const m = moment(this.msSinceEpoch).tz(tz.tz);
		return new LocalDateTime(new LocalDate(m.year(), m.month(), m.date()), new TimeOfDay(m.hour(), m.minute(), m.second()));
	}
	
	toLocalDate_jel_mapping: Object;
	toLocalDate(ctx: Context, tz: TimeZone): LocalDate {
		const m = moment(this.msSinceEpoch).tz(tz.tz);
		return new LocalDate(m.year(), m.month(), m.date());
	}

	// no JEL support
	toMoment(): Moment {
		return moment(this.msSinceEpoch);
	}
	
	getSerializationProperties(): any[] {
		return [this.msSinceEpoch, this.precisionInMs];
	}
	
	static fromMoment(m: Moment): Timestamp {
		return new Timestamp(m.valueOf());
	}
	
	static create_jel_mapping = {msSinceEpoch: 1, precisionInMs: 2};
	static create(ctx: Context, ...args: any[]): any {
		return new Timestamp(args[0], args[1]);
	}
}

Timestamp.prototype.JEL_PROPERTIES = {msSinceEpoch:1, precisionInMs:1};
Timestamp.prototype.reverseOps = {'-':1, '+': 1};

Timestamp.prototype.toNumber_jel_mapping = {};
Timestamp.prototype.toZonedDateTime_jel_mapping = {tz: 1};
Timestamp.prototype.toLocalDateTime_jel_mapping = {tz: 1};
Timestamp.prototype.toLocalDate_jel_mapping = {tz: 1};


