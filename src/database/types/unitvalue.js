'use strict';

const JelType = require('../../jel/type.js');
const FuzzyBoolean = require('./fuzzyboolean.js');


const ACCURACY_FACTOR = 0.9999999;  // to avoid rounding issues with fuzzy comparisons

/**
 * Represents a value with unit and accuracy.
 * All actual types need to inherit this.
 * They mus also set the constant PRIMARY_UNIT. To use automatic conversion, they should provide a table 
 * UNITS that maps types to the PRIMARY_UNIT.
 */
class UnitValue extends JelType {
	
	constructor(value, unit, accuracy) {
		super();
		this.value = value;
		this.unit = unit;
		this.accuracy = accuracy;
		this.primaryValue = this.convertValue(value, unit, this.PRIMARY_UNIT);
		this.primaryAccuracy = this.convertValue(accuracy, unit, this.PRIMARY_UNIT);
	}

	// !! must overwrite in sub-classes
	create(value, accuracy=this.accuracy, unit=this.unit) {
		throw new Error('create() needs to be overwritten');
	}
	
	convertTo(newUnit) {
		return this.recreate(this.convertValue(this.value, this.unit, newUnit),
										this.convertValue(this.accuracy, this.unit, newUnit),
										newUnit);
	}
	
	// !! must overwrite in sub-classes
	convertValue(value, fromUnit, toUnit) {
		if (fromUnit == toUnit)
			return value;
		if (!(toUnit in this.UNITS))
			throw new Error(`Unsupported unit ${toUnit}`);
		if (!(fromUnit in this.UNITS))
			throw new Error(`Unsupported unit ${fromUnit}`);
		return value * this.UNITS[fromUnit] / this.UNITS[toUnit];
	}
	
	// !! should overwrite in sub-classes
	op(operator, right) {
		if (right instanceof UnitValue && this.constructor === right.constructor) {
			if (this.unit == right.unit)
				switch (operator) {
					case '+':
						return this.recreate(this.value + right.value, Math.max(this.accuracy, right.accuracy));
					case '-':
						return this.recreate(this.value + right.value, Math.max(this.accuracy, right.accuracy));
					case '/':
						return this.value / right.value;

					case '===':
						return this.primaryValue === right.primaryValue;
					case '!==':
						return this.primaryValue !== right.primaryValue;
					case '>==':
						return this.primaryValue >= right.primaryValue;
					case '<==':
						return this.primaryValue >= right.primaryValue;
					case '>>':
						return this.primaryValue > right.primaryValue;
					case '<<':
						return this.primaryValue > right.primaryValue;

					case '==':
						return new FuzzyBoolean((this.primaryValue === right.primaryValue) || (this.inAccuracyRange(right) ? FuzzyBoolean.BARELY_TRUE : FuzzyBoolean.CLEARLY_FALSE), this.op('-', right).abs()); 
					case '!=':
						return new FuzzyBoolean((this.primaryValue !== right.primaryValue) && (this.inAccuracyRange(right) ? FuzzyBoolean.BARELY_FALSE : FuzzyBoolean.CLEARLY_TRUE) ,this.op('-', right).abs());
					case '>=':
						return new FuzzyBoolean((this.primaryValue >= right.primaryValue) ? (this.inAccuracyRange(right) ? FuzzyBoolean.BARELY_TRUE : FuzzyBoolean.CLEARLY_TRUE) : (this.inAccuracyRange(right) ? FuzzyBoolean.BARELY_FALSE : FuzzyBoolean.CLEARLY_FALSE), this.op('-', right).abs()); 
					case '<=':
						return new FuzzyBoolean((this.primaryValue <= right.primaryValue) ? (this.inAccuracyRange(right) ? FuzzyBoolean.BARELY_TRUE : FuzzyBoolean.CLEARLY_TRUE) : (this.inAccuracyRange(right) ? FuzzyBoolean.BARELY_FALSE : FuzzyBoolean.CLEARLY_FALSE), this.op('-', right).abs()); 
					case '>':
						return new FuzzyBoolean((this.primaryValue > right.primaryValue) ? (this.inAccuracyRange(right) ? FuzzyBoolean.BARELY_TRUE : FuzzyBoolean.CLEARLY_TRUE) : (this.inAccuracyRange(right) ? FuzzyBoolean.BARELY_FALSE : FuzzyBoolean.CLEARLY_FALSE), this.op('-', right).abs()); 
					case '<':
						return new FuzzyBoolean((this.primaryValue < right.primaryValue) ? (this.inAccuracyRange(right) ? FuzzyBoolean.BARELY_TRUE : FuzzyBoolean.CLEARLY_TRUE) : (this.inAccuracyRange(right) ? FuzzyBoolean.BARELY_FALSE : FuzzyBoolean.CLEARLY_FALSE), this.op('-', right).abs()); 
				}
			else
				return this.op(operator, this.convertTo(this.unit));
		}
		else if (typeof right == 'Number') {
			switch (operator) {
				case '*':
					return this.recreate(right * this.value);
				case '/':
					return this.recreate(this.value/right);
			}
			throw new Exception(`Unsupported operator ${operator} for numbers`);
		}
		super.op(operator, right);
	}
	
	inAccuracyRange(other) {
		return Math.abs(this.primaryValue - other.primaryValue) < (this.primaryAccuracy + other.primaryAccuracy) * ACCURACY_FACTOR;
	}
	
	singleOp(operator) {
		switch (operator) {
			case '!':
				return !this.value;
			case '-':
				return this.recreate(-this.value);
			case '+':
				return this.value;
		}
		super.singleOp(operator);	
	}
	
	abs() {
		if (this.value < 0)
			return this.recreate(Math.abs(this.value));
		else
			return this;
	}
	
	toBoolean() {
		return !!this.value;
	}
}

UnitValue.prototype.abs_jel_mapping = {};
UnitValue.prototype.convertTo_jel_mapping = {newUnit:0};
UnitValue.prototype.inAccuracyRange_jel_mapping = {other:0};
UnitValue.prototype.PUBLIC_MEMBERS = {value:1, unit:1, PRIMARY_UNIT:1, primaryValue:1, accuracy:1, primaryAccuracy:1};

module.exports = UnitValue;


