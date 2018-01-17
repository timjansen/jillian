import * as moment from 'moment';

import JelType from '../../JelType';
import FuzzyBoolean from '../FuzzyBoolean';
import TimeHint from './TimeHint';

/**
 * Represents a time of day.
 */
export default class TimeOfDay extends JelType {
	static readonly MIDNIGHT = new TimeOfDay(0);
	static readonly NOON = new TimeOfDay(12);
	
	constructor(public hour: number, public minute: number = 0, public seconds: number = 0) {
		super();
	}
	
	op(operator: string, right: any): any {
		return super.op(operator, right);
	}

	getSerializationProperties(): any[] {
		return [this.hour, this.minute, this.seconds];
	}
	
	static create_jel_mapping = {hour: 0, minute: 1, seconds: 2};
	static create(...args: any[]): any {
		return new TimeOfDay(args[0], args[1], args[2]);
	}

}


