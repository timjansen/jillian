import * as moment from 'moment';

import DbRef from '../../../database/DbRef';
import Duration from './Duration';
import DurationRange from './DurationRange';
import TimeSpec from './TimeSpec';
import Timestamp from './Timestamp';
import UnitValue from '../UnitValue';
import Range from '../Range';
import FactRelationshipType from './FactRelationshipType';
import FuzzyBoolean from '../FuzzyBoolean';

/**
 * Returns the time relative to the given Fact.
 */
export default class FactHint extends TimeSpec {
	
	constructor(public factObject: DbRef, public factId: number, 
							public relation: FactRelationshipType = FactRelationshipType.AFTER, public delay?: Duration|DurationRange|UnitValue|Range) {
		super();
	}
	
	getStartTime(): Promise<Timestamp>|Timestamp {
		return null as any; // TODO
	}
	
	getEndTime(): Promise<Timestamp>|Timestamp {
		return null as any; // TODO
	}
	
	isContinous(): FuzzyBoolean {
		return FuzzyBoolean.TRUE;
	}
	
	op(operator: string, right: any): any {
		return super.op(operator, right);
	}

	getSerializationProperties(): any[] {
		return [this.factObject, this.factId, this.relation, this.delay];
	}
	
	static create_jel_mapping = {factObject: 0, factId: 1, relation: 2, delay: 3};
	static create(...args: any[]): any {
		return new FactHint(args[0], args[1], args[2], args[3]);
	}
}


