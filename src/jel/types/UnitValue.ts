import JelType from '../JelType';
import FuzzyBoolean from './FuzzyBoolean';
import Fraction from './Fraction';
import ApproximateNumber from './ApproximateNumber';


/**
 * Represents a value with unit and accuracy.
 */
export default class UnitValue extends JelType {
	JEL_PROPERTIES: Object;
	
	constructor(public value: number | Fraction | ApproximateNumber, public unit: string) {
		super();
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
	
	abs_jel_mapping: Object;
	abs(): UnitValue {
		// TODO
		return new UnitValue(0, 'TODO');
	}
	
	toBoolean(): boolean {
		return !!this.value;
	}
}

UnitValue.prototype.abs_jel_mapping = {};
UnitValue.prototype.inAccuracyRange_jel_mapping = {other:0};
UnitValue.prototype.JEL_PROPERTIES = {value:1, unit:1, PRIMARY_UNIT:1, primaryValue:1, accuracy:1, primaryAccuracy:1};


