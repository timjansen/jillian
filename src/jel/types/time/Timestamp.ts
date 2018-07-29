import JelType from '../../JelType';
import UnitValue from '../UnitValue';
import FuzzyBoolean from '../FuzzyBoolean';
import TimeSpec from './TimeSpec';
import ZonedDateTime from './ZonedDateTime';
import TimeZone from './TimeZone';
import LocalDateTime from './LocalDateTime';
import LocalDate from './LocalDate';
import TimeOfDay from './TimeOfDay';
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
	
	op(operator: string, right: any): any {
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

			}
		}
		else if (right instanceof UnitValue) {
			const v = right.convertToValue('Millisecond');
			if (v === undefined)
				throw new Error('Can not convert right operand to milliseconds');

			switch (operator) {
				case '+':
					return new Timestamp(this.msSinceEpoch + v, this.precisionInMs);
				case '-':
					return new Timestamp(this.msSinceEpoch - v, this.precisionInMs);
			}
		}
		return super.op(operator, right);
	}
	
	getStartTime(defaultTimeZone: TimeZone): Timestamp {
		return this;
	}

	getEndTime(defaultTimeZone: TimeZone): Timestamp {
		return this;
	}

	isContinous(): FuzzyBoolean {
		return FuzzyBoolean.CLEARLY_TRUE;
	}

	toNumber_jel_mapping: Object;
	toNumber(): number {
		return this.msSinceEpoch;
	}
	
	toZonedDateTime_jel_mapping: Object;
	toZonedDateTime(tz: TimeZone): ZonedDateTime {
		const m = moment(this.msSinceEpoch).tz(tz.tz);
		return new ZonedDateTime(tz, new LocalDate(m.year(), m.month(), m.date()), new TimeOfDay(m.hour(), m.minute(), m.second()), m.milliseconds());
	}

	toLocalDateTime_jel_mapping: Object;
	toLocalDateTime(tz: TimeZone): LocalDateTime {
		const m = moment(this.msSinceEpoch).tz(tz.tz);
		return new LocalDateTime(new LocalDate(m.year(), m.month(), m.date()), new TimeOfDay(m.hour(), m.minute(), m.second()));
	}
	
	toLocalDate_jel_mapping: Object;
	toLocalDate(tz: TimeZone): LocalDate {
		const m = moment(this.msSinceEpoch).tz(tz.tz);
		return new LocalDate(m.year(), m.month(), m.date());
	}

	toTimeOfDay_jel_mapping: Object;
	toTimeOfDay(tz: TimeZone): TimeOfDay {
		const m = moment(this.msSinceEpoch).tz(tz.tz);
		return new TimeOfDay(m.hour(), m.minute(), m.second());
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
	
	static create_jel_mapping = {msSinceEpoch: 0, precisionInMs: 1};
	static create(...args: any[]): any {
		return new Timestamp(args[0], args[1]);
	}
}

Timestamp.prototype.toNumber_jel_mapping = {};
Timestamp.prototype.toZonedDateTime_jel_mapping = {tz: 0};
Timestamp.prototype.toLocalDateTime_jel_mapping = {tz: 0};
Timestamp.prototype.toLocalDate_jel_mapping = {tz: 0};
Timestamp.prototype.toTimeOfDay_jel_mapping = {tz: 0};


