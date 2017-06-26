'use strict';

const ImperialUnitValue = require('./imperialunitvalue.js');

const IMPERIAL_UNITS = {in: 1, ft: 12, yd: 36, mile: 63360};
const INCH = 0.0254;
const UNITS = {in: INCH, ft: 12*INCH, yd: 36*INCH, mile: 63360*INCH,
							nm :1e-9, micrometer: 1e-6, mm: 1e-3, cm: 1e-2, dm: 1e-1, m: 1, km: 1000, 
							M: 1852, ly: 9.4607e15, pc: 3.0857e16};

class Length extends ImperialUnitValue {
	
	constructor(value, unit = 'm', accuracy = 0.5) {
		super(value, unit, accuracy);
	}

	create(value, accuracy=this.accuracy, unit=this.unit) {
		return new Length(value, unit, accuracy);
	}
	
	// !! must overwrite in sub-classes
	op(operator, right) {
		if (right instanceof Length && right.unit == this.unit) {
			switch (operator) {
				case '*':
					throw new Error(`Multiplying length not supported yet`);
				default:
					return super.op(operator, right);
			}
		}
		super.op(operator, right);
	}
	
	static create(value, unit, accuracy) {
		return new Length(value, unit, accuracy);
	}

}

Length.prototype.PRIMARY_UNIT = 'm';
Length.prototype.IMPERIAL_UNITS = IMPERIAL_UNITS;
Length.prototype.UNITS = UNITS;

Length.create_jel_mapping = {value:0, unit:1, accuracy:2};

module.exports = Length;
