import JelType from '../../jel/JelType';
import FuzzyBoolean from './FuzzyBoolean';
import Fraction from './Fraction';


const ACCURACY_FACTOR = 0.9999999;  // to avoid rounding issues with fuzzy comparisons

/**
 * Represents a value with unit and accuracy.
 * They mus also set the constant PRIMARY_UNIT. To use automatic conversion, they should provide a table 
 * UNITS that maps types to the PRIMARY_UNIT.
 */
export default class UnitValue extends JelType {
	JEL_PROPERTIES;
	
	constructor(public value: number | Fraction, public unit: string, public accuracy: number | Fraction = 0) {
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


