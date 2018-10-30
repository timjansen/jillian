import * as moment from 'moment';

import JelObject from '../../JelObject';
import Context from '../../Context';
import JelBoolean from '../JelBoolean';
import JelNumber from '../JelNumber';
import DateHint from './DateHint';
import LocalDate from './LocalDate';
import Range from '../Range';
import PartOfMonthType from './PartOfMonthType';

/**
 * Represents one or more days in a month
 */
export default class PartOfMonth extends JelObject implements DateHint {
	constructor(public type: PartOfMonthType, public count: number) {
		super();
	}
	
	containsDate(date: LocalDate): boolean|Promise<boolean> {
		return false; // TODO
	}

	getDatesForYear(year: number): LocalDate[]|Promise<Array<LocalDate>> {
		return []; // TODO
	}
	
	getYearRange(): Range|Promise<Range> { // Range of two integers
		return new Range(JelNumber.valueOf(0), JelNumber.valueOf(0)); // TODO
	}
	
	
	op(ctx: Context, operator: string, right: any): any {
		return super.op(ctx, operator, right);
	}

	getSerializationProperties(): any[] {
		return [this.type, this.count];
	}
	
	static create_jel_mapping = {type: 1};
	static create(ctx: Context, ...args: any[]): any {
		return new PartOfMonth(args[0], args[1]);
	}

}


