import * as moment from 'moment';

import JelType from '../../JelType';
import FuzzyBoolean from '../FuzzyBoolean';
import PartOfYearType from './PartOfYearType';
import DateHint from './DateHint';
import LocalDate from './LocalDate';
import Range from '../Range';


/**
 * Represents a time of year, like a quarter or calendar week.
 */
export default class TimeOfYear extends JelType implements DateHint {
	constructor(public type: PartOfYearType, public number: number) {
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
	
	
	op(operator: string, right: any): any {
		return super.op(operator, right);
	}

	getSerializationProperties(): any[] {
		return [this.type, this.number];
	}
	
	static create_jel_mapping = {type: 0, number: 1};
	static create(...args: any[]): any {
		return new TimeOfYear(args[0], args[1]);
	}

}


