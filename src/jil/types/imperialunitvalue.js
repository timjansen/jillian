
// Base class for UnitValues that support imperial units in addition to metric units.
// It avoids rounding errors by using the base imperial unit for calculations.
class ImperialUnitValue extends UnitValue {
	
	constructor(value, unit, accuracy) {
		super(value, unit, accuracy);
	}
	
	convertValue(value, fromUnit, toUnit) {
		if (fromUnit == toUnit)
			return value;
		if (fromUnit in this.IMPERIAL_UNITS && toUnit in this.IMPERIAL_UNITS)
			return value * this.IMPERIAL_UNITS[fromUnit] / this.IMPERIAL_UNITS[toUnit];
		return super.convertValue(value, fromUnit, toUnit);
	}
}
