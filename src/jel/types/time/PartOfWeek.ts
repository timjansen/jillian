import * as moment from 'moment';

import JelType from '../../JelType';
import Context from '../../Context';
import FuzzyBoolean from '../FuzzyBoolean';
import DateHint from './DateHint';
import LocalDate from './LocalDate';
import Range from '../Range';
import PartOfWeekType from './PartOfWeekType';

/**
 * Represents one or more weekdays
 */
export default class PartOfWeek extends JelType implements DateHint {
	constructor(public type: PartOfWeekType) {
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
	
	
	op(ctx: Context, operator: string, right: any): any {
		return super.op(ctx, operator, right);
	}

	getSerializationProperties(): any[] {
		return [this.type];
	}
	
	static create_jel_mapping = {type: 1};
	static create(ctx: Context, ...args: any[]): any {
		return new PartOfWeek(args[0]);
	}

}


