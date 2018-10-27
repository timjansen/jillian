import * as moment from 'moment';

import JelObject from '../../JelObject';
import Context from '../../Context';
import FuzzyBoolean from '../FuzzyBoolean';
import TimeHint from './TimeHint';

/**
 * Represents a time of day.
 */
export default class TimeOfDay extends JelObject {
	static readonly MIDNIGHT = new TimeOfDay(0);
	static readonly NOON = new TimeOfDay(12);
	
	constructor(public hour: number, public minute: number = 0, public seconds: number = 0) {
		super();
	}
	
	op(ctx: Context, operator: string, right: any): any {
		return super.op(ctx, operator, right);
	}

	getSerializationProperties(): any[] {
		return [this.hour, this.minute, this.seconds];
	}
	
	static create_jel_mapping = {hour: 1, minute: 2, seconds: 3};
	static create(ctx: Context, ...args: any[]): any {
		return new TimeOfDay(args[0], args[1], args[2]);
	}

}


