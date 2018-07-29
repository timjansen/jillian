import JelType from '../JelType';
import FuzzyBoolean from './FuzzyBoolean';
import Fraction from './Fraction';
import ApproximateNumber from './ApproximateNumber';
import DbRef from '../../database/DbRef';


/**
 * Represents a value with unit and accuracy.
 */
export default class UnitValue extends JelType {
	JEL_PROPERTIES: Object;
	unit: DbRef;
	
	constructor(public value: number | Fraction | ApproximateNumber, unit: DbRef | string) {
		super();
		this.unit = typeof unit == 'string' ? new DbRef(unit) : unit;
	}

	op(operator: string, right: any): any {
		// TODO
	}
	
	inAccuracyRange_jel_mapping: Object;
	inAccuracyRange(other: any): boolean {
//		return Math.abs(this.primaryValue - other.primaryValue) < (this.primaryAccuracy + other.primaryAccuracy) * ACCURACY_FACTOR;
		return false;
	}
	
	singleOp(operator: string): any {
		// TODO
	}

		// returns the UnitValue converted to the given value, or undefined of conversion not possible
	convertToValue(type: string): number | undefined {
		return undefined; // TODO
	}

	
	// returns the UnitValue converted to the given value, or undefined of conversion not possible
	convertTo_jel_mapping: Object;
	convertTo(type: string): UnitValue | undefined {
		return; // TODO
	}
	
	toNumber_jel_mapping: Object;
	toNumber(): number {
		if (typeof this.value == 'number')
			return this.value;
		else
			return this.value.toNumber();
	}
	
	toBoolean(): FuzzyBoolean {
		return FuzzyBoolean.toFuzzyBoolean(!!this.value);
	}
}

UnitValue.prototype.toNumber_jel_mapping = {};
UnitValue.prototype.convertTo_jel_mapping = {type: 0};
UnitValue.prototype.inAccuracyRange_jel_mapping = {other:0};
UnitValue.prototype.JEL_PROPERTIES = {value:1, unit:1, PRIMARY_UNIT:1, primaryValue:1, accuracy:1, primaryAccuracy:1};


