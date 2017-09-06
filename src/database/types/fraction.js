'use strict';

const JelType = require('../../jel/type.js');
const UnitValue = require('./unitvalue.js');

/**
 * Represents a fraction.
 */
class Fraction extends JelType {
	constructor(numerator, denominator) {
		super();
		this.numerator = numerator; 
		this.denominator = denominator; 
	}
	
	op(operator, right) {
		if (right == null)
			return null;
		if (right instanceof Range) {
			if (operator == '==' || operator == '===')
				return Type.op('==', this.min, right.min) && Type.op('==', this.max, right.max);
		}
		else if (typeof right == 'number' || right instanceof UnitValue)
			return right.contains(right);
		super.op(operator, right);
	}
	
	contains(right) {
		return (this.min == null || Type.op('<=', this.min, right)) &&
			(this.max == null || Type.op('>=', this.max, right));
	}
						
	static withAccuracy(value, accuracy) {
		return new Range(value - accuracy, value + accuracy);
	}
	
	static create(min, max) {
		return new Range(min, max);
	}
}

Range.create_jel_mapping = {min:0, max:1};



module.exports = Range;



		