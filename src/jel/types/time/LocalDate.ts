import * as moment from 'moment';

import JelType from '../../JelType';
import FuzzyBoolean from '../FuzzyBoolean';
import Timestamp from './Timestamp';
import TimeSpec from './TimeSpec';
import TimeZone from './TimeZone';

/**
 * Represents a date.
 */
export default class LocalDate extends TimeSpec {
	
	constructor(public year: number, public month: number, public day: number) {
		super();
	}
	
  getStartTime(zone: TimeZone): Timestamp {
		return null as any; // TODO
	}
	
	getEndTime(zone: TimeZone): Timestamp {
		return null as any; // TODO
	}
	
	isContinous(): boolean {
		return true;
	}
	
	op(operator: string, right: any): any {
		return super.op(operator, right);
	}

	getSerializationProperties(): any[] {
		return [this.year, this.month, this.day];
	}
	
	static create_jel_mapping: any = {year: 0, month: 1, day: 2};
	static create(...args: any[]): any {
		return new LocalDate(args[0], args[1], args[2]);
	}
}


