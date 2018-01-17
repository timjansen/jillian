import TimeOfDay from './TimeOfDay';
import List from '../List';


/**
 * Interface that represents a filter of time-of-day periods.
 */
export default interface TimeHint {
	
	contains(time: TimeOfDay): boolean|Promise<boolean>;
	ranges(): List; // list of TimeOfDayRange
}


