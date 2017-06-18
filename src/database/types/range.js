'use strict';

const JelType = require('../../jel/type.js');
const UnitValue = require('./unitvalue.js');

/**
 * Represents a range of numeric values. Numbers can be primitive numbers of UnitValues. 
 * Ranges can be open-ended by passing a null for the min and/or max.
 */
class Range extends JelType {
	constructor(min, max) {
		super();
		this.min = min; // inclusive; may be null for unbounded
		this.max = max; // inclusive: may be null for unbounded
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






		