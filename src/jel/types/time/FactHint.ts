import * as moment from 'moment';

import Context from '../../Context';
import {IDbRef} from '../../IDatabase';
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
	
	constructor(public factObject: IDbRef, public factId: number, 
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
	
	op(ctx: Context, operator: string, right: any): any {
		return super.op(ctx, operator, right);
	}

	getSerializationProperties(): any[] {
		return [this.factObject, this.factId, this.relation, this.delay];
	}
	
	static create_jel_mapping = {factObject: 1, factId: 2, relation: 3, delay: 4};
	static create(ctx: Context, ...args: any[]): any {
		return new FactHint(args[0], args[1], args[2], args[3]);
	}
}


