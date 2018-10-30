import * as moment from 'moment';

import JelObject from '../../JelObject';
import Context from '../../Context';
import TimeHint from './TimeHint';
import TimeOfDay from './TimeOfDay';
import PartOfDayType from './PartOfDayType';
import JelBoolean from '../JelBoolean';
import List from '../List';

/**
 * Represents a part of the day (morning, night...).
 */
export default class PartOfDay extends JelObject implements TimeHint {
	constructor(public type: PartOfDayType) {
		super();
	}
	
	contains(time: TimeOfDay): boolean|Promise<boolean> {
		return false; // TODO
	}
	
	ranges(): List { // list of TimeOfDayRange
		return new List(); // TODO
	}
	
	op(ctx: Context, operator: string, right: any): any {
		return super.op(ctx, operator, right);
	}

	getSerializationProperties(): any[] {
		return [this.type];
	}
	
	static create_jel_mapping = {type: 1};
	static create(ctx: Context, ...args: any[]): any {
		return new PartOfDay(args[0]);
	}

}


