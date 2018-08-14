import JelType from '../JelType';
import Context from '../Context';
import {IDbRef} from '../IDatabase';
import FuzzyBoolean from './FuzzyBoolean';
import Fraction from './Fraction';
import ApproximateNumber from './ApproximateNumber';


/**
 * Represents a value with unit and accuracy.
 */
export default class UnitValue extends JelType {
	JEL_PROPERTIES: Object;
	
	constructor(public value: number | Fraction | ApproximateNumber, public unit: IDbRef, public unitExponent = 1) {
		super();
	}

	op(ctx: Context, operator: string, right: any): any {
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
						return JelType.op(ctx, operator, this.value, right.value);
				case '+':
				case '-':
						return new UnitValue(JelType.op(ctx, operator, this.value, right.value), this.unit, this.unitExponent);
				case '/':
						return JelType.op(ctx, operator, this.value, right.value);
				}
			}
			
			// TODO: conversion rules
			switch (operator) {
			case '*':
					// TODO
					return new UnitValue(JelType.op(ctx, operator, this.value, right.value), this.unit, this.unitExponent + right.unitExponent);
			case '/':
					// TODO
			}
		}
		else if (typeof right == 'number' || right instanceof Fraction || right instanceof ApproximateNumber) {
				switch (operator) {
				case '*':
				case '/':
					return new UnitValue(JelType.op(ctx, operator, this.value, right), this.unit, this.unitExponent);
				}		
		}
	}
	
	singleOp(ctx: Context, operator: string): any {
		if (operator == '!') 
			return JelType.singleOp(ctx, operator, this.value);
		if (operator == 'abs')
			return new UnitValue(JelType.singleOp(ctx, operator, this.value), this.unit, this.unitExponent);
		return super.singleOp(ctx, operator);
	}

	opReversed(ctx: Context, operator: string, left: any): any {
		if (typeof left == 'number' || left instanceof Fraction || left instanceof ApproximateNumber) {
			switch (operator) {
				case '*':
				case '/':
						return new UnitValue(JelType.op(ctx, operator, left, this.value), this.unit, this.unitExponent);
				}		
		}
		return super.opReversed(ctx, operator, left);
	}
		// returns the UnitValue converted to the given value, or undefined of conversion not possible
	convertToValue(ctx: Context, unit: string | IDbRef): number | undefined {
		const v = this.convertTo(ctx, unit);
		return v && JelType.toNumber(v.value);
	}

	
	// returns the UnitValue converted to the given value, or undefined of conversion not possible
	convertTo_jel_mapping: Object;
	convertTo(ctx: Context, unit: string|IDbRef): UnitValue | undefined {
		const ref = ctx.dbSession.createDbRef(unit);
		return undefined; // TODO
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
UnitValue.prototype.convertTo_jel_mapping = {'>ctx': true, type: 1};
UnitValue.prototype.JEL_PROPERTIES = {value:1, unit:1, unitExponent:1};


