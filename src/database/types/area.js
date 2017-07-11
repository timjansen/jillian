'use strict';

const ImperialUnitValue = require('./imperialunitvalue.js');

const IMPERIAL_UNITS = {sqin: 1, sqft: 144, sqyd: 9*144, sqmile: 27878400*144, acre: 66*660*144};
const SQINCH = 0.0254*0.0254;
const UNITS = {sqin: 1*SQINCH, sqft: 144*SQINCH, sqyd: 9*144*SQINCH, sqmile: 144*27878400*SQINCH, acre: 66*660*144*SQINCH, sqkm: 1e6, ha: 10000, b: 1e-28};

class Area extends ImperialUnitValue {
	
	constructor(value, unit = 'sqm', accuracy = 0.5) {
		super(value, unit, accuracy);
	}

	create(value, accuracy=this.accuracy, unit=this.unit) {
		return new Area(value, unit, accuracy);
	}

	static create(value, unit, accuracy) {
		return new Area(value, unit, accuracy);
	}
}

Area.prototype.PRIMARY_UNIT = 'sqm';
Area.prototype.IMPERIAL_UNITS = IMPERIAL_UNITS;
Area.prototype.UNITS = UNITS;

Area.create_jel_mapping = {value:0, unit:1, accuracy:2};

module.exports = Area;