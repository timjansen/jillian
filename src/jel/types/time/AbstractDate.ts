import * as moment from 'moment-timezone';
import Moment = moment.Moment;

import Util from '../../../util/Util';
import Runtime from '../../Runtime';
import JelObject from '../../JelObject';
import Context from '../../Context';
import JelNumber from '../JelNumber';
import UnitValue from '../UnitValue';
import JelBoolean from '../JelBoolean';
import Timestamp from './Timestamp';
import TimeOfDay from './TimeOfDay';
import TimeDescriptor from './TimeDescriptor';
import Duration from './Duration';
import TypeChecker from '../TypeChecker';

/**
 * Represents a year, month or day
 */
export default abstract class AbstractDate extends TimeDescriptor {
	private static readonly MONTHS_MAX_DURATION = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	year: number;
	month: number | null;
	day: number | null;
	
	constructor() {
		super();
	}
	
	isContinous(): JelBoolean {
		return JelBoolean.TRUE;
	}

	// m0: 0-11
	protected getMonth0Duration(year: number, m0: number) {
		if (m0 != 1)
			return AbstractDate.MONTHS_MAX_DURATION[m0];
		else 
			return moment([year]).isLeapYear() ? 29 : 28;
	}

	get dayOfYear(): number {
		let md = 0;
		const m = this.month || 1;
		for (let i = 1; i < m; i++)
			md += this.getMonth0Duration(this.year, i-1);
		return md + (this.day || 1);
	}
	
	isValid(): boolean {
		return (this.month != null ? (this.month >= 1 && this.month <= 12) : this.day == null) && 
						(this.day == null || (this.day >= 1 && this.day <= this.getMonth0Duration(this.year, this.month!-1)));
	}
	
	abstract toMoment(): Moment;
	abstract toMomentTz(tz: string): Moment;


}

AbstractDate.prototype.JEL_PROPERTIES = {year:1, month:1, day: 1, dayOfYear: 1};


