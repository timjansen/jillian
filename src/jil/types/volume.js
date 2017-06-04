

const IMPERIAL_UNITS = {cuin: 1, cuft: 12*12*12, cuyd: 36*36*36, cumile: 147197952000*12*12*12};
const CUINCH = 0.0254*0.0254*0.0254;
const FLOZ_UNITS = {floz: 1, pint: 16, quart: 32, gallon: 128};
const FLOZ = 0.02841306;
const UNITS = {cuin: 1*CUINCH, cuft: 12*12*12*CUINCH, cuyd: 36*36*36*CUINCH, cumile: 147197952000*12*12*12*CUINCH,
							 floz: 1*FLOZ, pint: 16*FLOZ, quart: 32*FLOZ, gallon: 128*FLOZ,
							 cbm: 1, cbkm: 1e9, ccm: 1e-6, l:1e-3, ml: 1e-6};

class Volume extends ImperialUnitValue {
	
	constructor(value, unit = 'cbm', accuracy = 0.5) {
		super(value, unit, accuracy);
	}

	create(value, accuracy=this.accuracy, unit=this.unit) {
		return new Volume(value, unit, accuracy);
	}
	
	convertValue(value, fromUnit, toUnit) {
		if (fromUnit in this.FLOZ_UNITS && toUnit in this.FLOZ_UNITS)
			return value * this.FLOZ_UNITS[fromUnit] / this.FLOZ_UNITS[toUnit];
		return super.convertValue(value, fromUnit, toUnit);
	}
	
	static create(value, unit, accuracy) {
		return new Volume(value, unit, accuracy);
	}
}

Volume.prototype.PRIMARY_UNIT = 'cbm';
Volume.prototype.IMPERIAL_UNITS = IMPERIAL_UNITS;
Volume.prototype.UNITS = UNITS;

Volume.create_jel_mapping = {value:0, unit:1, accuracy:2};



