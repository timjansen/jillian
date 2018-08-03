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
	
	constructor(public value: number | Fraction | ApproximateNumber, unit: DbRef | string, public unitExponent = 1) {
		super();
		this.unit = typeof unit == 'string' ? new DbRef(unit) : unit;
	}

	op(operator: string, right: any): any {
		if (right instanceof UnitValue) {
			if (right.unit.distinctName == this.unit.distinctName && right.unitExponent == this.unitExponent) {
				switch (operator) {
				case '==': 
				case '===':
				case '>>':
				case '<<':
				case '<<=':
				case '>>=':
				case '!=':
				case '!==':
				case '>':
				case '<':
				case '<=':
				case '>=':
						return JelType.op(operator, this.value, right.value);
				case '+':
				case '-':
						return new UnitValue(JelType.op(operator, this.value, right.value), this.unit, this.unitExponent);
				case '/':
						return JelType.op(operator, this.value, right.value);
				}
			}
			
			// TODO: conversion rules
			switch (operator) {
			case '*':
					// TODO
					return new UnitValue(JelType.op(operator, this.value, right.value), this.unit, this.unitExponent + right.unitExponent);
			case '/':
					// TODO
			}
		}
		else if (typeof right == 'number' || right instanceof Fraction || right instanceof ApproximateNumber) {
				switch (operator) {
				case '*':
				case '/':
					return new UnitValue(JelType.op(operator, this.value, right), this.unit, this.unitExponent);
				}		
		}
	}
	
	singleOp(operator: string): any {
		if (operator == '!') 
			return JelType.singleOp(operator, this.value);
		return super.singleOp(operator);
	}

	opReversed(operator: string, left: any): any {
		if (typeof left == 'number' || left instanceof Fraction || left instanceof ApproximateNumber) {
			switch (operator) {
				case '*':
				case '/':
						return new UnitValue(JelType.op(operator, left, this.value), this.unit, this.unitExponent);
				}		
		}
		return super.opReversed(operator, left);
	}
		// returns the UnitValue converted to the given value, or undefined of conversion not possible
	convertToValue(type: string): number | undefined {
		return undefined; // TODO
	}

	
	// returns the UnitValue converted to the given value, or undefined of conversion not possible
	convertTo_jel_mapping: Object;
	convertTo(type: string|DbRef): UnitValue | undefined {
		return; // TODO
	}
	
	toNumber_jel_mapping: Object;
	toNumber(): number {
		return JelType.toNumber(this.value);
	}
	
	toBoolean(): FuzzyBoolean {
		return FuzzyBoolean.toFuzzyBoolean(!!this.toNumber());
	}
	
	getSerializationProperties(): any[] {
		return [this.value, this.unit, this.unitExponent];
	}
	
	static create_jel_mapping = {value: 0, unit: 1, unitExponent: 2};
	static create(...args: any[]): UnitValue {
		return new UnitValue(args[0], args[1], args[2]);
	}
}

UnitValue.prototype.reverseOps = {'-':1, '/': 1};
UnitValue.prototype.toNumber_jel_mapping = {};
UnitValue.prototype.convertTo_jel_mapping = {type: 0};
UnitValue.prototype.JEL_PROPERTIES = {value:1, unit:1, unitExponent:1};


