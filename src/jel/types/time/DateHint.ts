import TimeHint from './TimeHint';
import LocalDate from './LocalDate';
import TimeZone from './TimeZone';
import Range from '../Range';

/**
 * Interface that filters dates.
 */
export default interface DateHint {
	
	containsDate(date: LocalDate): boolean|Promise<boolean>;

	getDatesForYear(year: number): LocalDate[]|Promise<Array<LocalDate>>;
	
	getYearRange(): Range|Promise<Range|undefined>|undefined; // Range of two integers. Undefined if not limited to some years.
	
}

