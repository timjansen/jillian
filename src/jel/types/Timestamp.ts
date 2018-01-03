import JelType from '../JelType';
import UnitValue from './UnitValue';
import FuzzyBoolean from './FuzzyBoolean';
import Fraction from './Fraction';

/**
 * Represents a timestamp, relative to epoch.
 */
export default class Timestamp extends JelType {
	
	constructor(public msSinceEpoch: number, public precisionInMs = 1) {
		super();
	}
	
	private couldBeEqual(other: Timestamp): boolean {
		return Math.abs(this.msSinceEpoch - other.msSinceEpoch) <= (this.precisionInMs + other.precisionInMs);
	}
	
	op(operator: string, right: any): any {
		if (right instanceof Timestamp) {
			switch (operator) {
				case '===':
					return this.msSinceEpoch === right.msSinceEpoch;
				case '!==':
					return this.msSinceEpoch !== right.msSinceEpoch;
				case '==':
					return FuzzyBoolean.fourWay(this.msSinceEpoch === right.msSinceEpoch, this.couldBeEqual(right));
				case '!=':
					return FuzzyBoolean.fourWay(this.msSinceEpoch !== right.msSinceEpoch, this.couldBeEqual(right));
				
				case '>>':
					return this.msSinceEpoch > right.msSinceEpoch;
				case '<<':
					return this.msSinceEpoch < right.msSinceEpoch;
				case '>':
					return FuzzyBoolean.fourWay(this.msSinceEpoch > right.msSinceEpoch, this.couldBeEqual(right));
				case '<':
					return FuzzyBoolean.fourWay(this.msSinceEpoch < right.msSinceEpoch, this.couldBeEqual(right));

				case '>>=':
					return this.msSinceEpoch >= right.msSinceEpoch;
				case '<<=':
					return this.msSinceEpoch <= right.msSinceEpoch;
				case '>=':
					return FuzzyBoolean.fourWay(this.msSinceEpoch >= right.msSinceEpoch, this.couldBeEqual(right));
				case '<=':
					return FuzzyBoolean.fourWay(this.msSinceEpoch <= right.msSinceEpoch, this.couldBeEqual(right));

			}
		}
		else if (right instanceof UnitValue) {
			const v = right.convertToValue('Millisecond');
			if (v === undefined)
				throw new Error('Can not convert right operand to milliseconds');

			switch (operator) {
				case '+':
					return new Timestamp(this.msSinceEpoch + v, this.precisionInMs);
				case '-':
					return new Timestamp(this.msSinceEpoch - v, this.precisionInMs);
			}
		}
		super.op(operator, right);
	}

	toNumber_jel_mapping: Object;
	toNumber(): number {
		return this.msSinceEpoch;
	}
	
	getSerializationProperties(): any[] {
		return [this.msSinceEpoch, this.precisionInMs];
	}
	
	static create_jel_mapping = {msSinceEpoch: 0, precisionInMs: 1};
	static create(...args: any[]): any {
		return new Timestamp(args[0], args[1]);
	}
}

Fraction.prototype.toNumber_jel_mapping = {};

