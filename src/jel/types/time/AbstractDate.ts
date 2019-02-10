import * as moment from 'moment-timezone';
import Moment = moment.Moment;

import Util from '../../../util/Util';
import Runtime from '../../Runtime';
import JelObject from '../../JelObject';
import {IDbRef} from '../../IDatabase';
import Context from '../../Context';
import Float from '../Float';
import List from '../List';
import UnitValue from '../UnitValue';
import JelBoolean from '../JelBoolean';
import Timestamp from './Timestamp';
import TimeOfDay from './TimeOfDay';
import TimeDescriptor from './TimeDescriptor';
import Duration from './Duration';
import TypeChecker from '../TypeChecker';
import NativeJelObject from '../NativeJelObject';
import Class from '../Class';
import SourcePosition from '../../SourcePosition';
import RuntimeError from '../../RuntimeError';

/**
 * Represents a year, month or day
 */
export default abstract class AbstractDate extends TimeDescriptor {
	private static readonly MONTHS_MAX_DURATION = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	private static readonly JEL_TO_MOMENT_TYPES: any = {Year: 'years', Month: 'months', Day: 'days', Hour: 'hours', Minute: 'minutes', Second: 'seconds'};
  
  year_jel_property: boolean;
  month_jel_property: boolean;
  day_jel_property: boolean;
  dayOfYear_jel_property: boolean;
  dayOfWeek_jel_property: boolean;
  isoWeek_jel_property: boolean;
  isoWeeksInYear_jel_property: boolean;
  quarter_jel_property: boolean;
  century_jel_property: boolean;
  millenium_jel_property: boolean;
  allDays_jel_property: boolean;
  leapYear_jel_property: boolean;
  numberOfDays_jel_property: boolean;
  
	year: number;
	month: number | null;
	day: number | null;
	
	constructor(className: string) {
		super(className);
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
  
  get leapYear(): boolean {
    return (this.year % 4 == 0) && moment([this.year]).isLeapYear();
  }

  get numberOfDays(): UnitValue {
    return new UnitValue(Float.valueOf(this.day != null ? 1 : (this.month != null ? this.getMonth0Duration(this.year, this.month-1) : (this.leapYear ? 366 : 355))), 'Day');
  }

	get dayOfYear(): number {
		let md = 0;
		const m = this.month || 1;
		for (let i = 1; i < m; i++)
			md += this.getMonth0Duration(this.year, i-1);
		return md + (this.day || 1);
	}
	
	// Sunday==0, Saturday==6
	get dayOfWeek(): number {
		return this.toMoment().day();
	}

	// iso number of the week
	get isoWeek(): number {
		return this.toMoment().isoWeek();
	}

	// iso number of the year
	get isoWeeksInYear(): number {
		return this.toMoment().isoWeeksInYear();
	}

	get quarter(): number {
		return this.toMoment().quarter();
	}

	// number of century, e.g. 20 for 1900-1999, 21 for 2000-2100
	get century(): number {
		return Math.floor(this.year/100)+1;
	}

	// number of millenium, e.g. 2 for 1000-1999, 3 for 2000-2199
	get millenium(): number {
		return Math.floor(this.year/1000)+1;
	}

  // returns a list of all days as LocalDate in the given year. Makes more sense if day and possibly month are null.
  get allDays(): List {
    if (this.day != null)
      return new List([this.toDate(this.year, this.month||1, this.day)]);

    const dl = [];
    if (this.month == null) {
      for (let j = 1; j <= 12; j++) {
        const dayCount = this.getMonth0Duration(this.year, j-1);
        for (let i = 1; i <= dayCount; i++)
          dl.push(this.toDate(this.year, j, i));
      }
    }
    else {
      const dayCount = this.getMonth0Duration(this.year, this.month-1);
      for (let i = 1; i <= dayCount; i++)
        dl.push(this.toDate(this.year, this.month, i));
    }
    return new List(dl);
  }
  
	diff_jel_mapping: boolean;
	diff(ctx: Context, otherDate0: any, type0: any): UnitValue | Promise<UnitValue> {
		const otherDate: AbstractDate = TypeChecker.instance(AbstractDate, otherDate0, "otherDate");
		const type: string = (typeof type0 == 'string') ? type0 : TypeChecker.dbRef(type0, "type").distinctName;
		if (!(type in AbstractDate.JEL_TO_MOMENT_TYPES))
			return (this.diff(ctx, otherDate0, 'Second') as UnitValue).convertTo(ctx, type);
		else
			return new UnitValue(Float.valueOf(this.toMoment().diff(otherDate.toMoment(), AbstractDate.JEL_TO_MOMENT_TYPES[type])), type);
	}
	
	isValid(): boolean {
		return (this.month != null ? (this.month >= 1 && this.month <= 12) : this.day == null) && 
						(this.day == null || (this.day >= 1 && this.day <= this.getMonth0Duration(this.year, this.month!-1)));
	}
	
	abstract toMoment(): Moment;
	abstract toMomentTz(tz: string): Moment;
  abstract toDate(year: number, month: number, day: number): AbstractDate;

}

AbstractDate.prototype.year_jel_property = true;
AbstractDate.prototype.month_jel_property = true;
AbstractDate.prototype.day_jel_property = true;
AbstractDate.prototype.dayOfYear_jel_property = true;
AbstractDate.prototype.dayOfWeek_jel_property = true;
AbstractDate.prototype.isoWeek_jel_property = true;
AbstractDate.prototype.isoWeeksInYear_jel_property = true;
AbstractDate.prototype.quarter_jel_property = true;
AbstractDate.prototype.century_jel_property = true;
AbstractDate.prototype.millenium_jel_property = true;
AbstractDate.prototype.allDays_jel_property = true;
AbstractDate.prototype.leapYear_jel_property = true;
AbstractDate.prototype.numberOfDays_jel_property = true;
AbstractDate.prototype.diff_jel_mapping = true;

