

class UnitValue extends Type {
	
	constructor(value, unit, accuracy = 0.5) {
		this.givenValue = value;
		this.givenUnit = unit;
		this.givenAccuracy = accuracy;
		this.value = this.convertToPrimaryUnit(value, unit);
		this.accuracy = this.convertToPrimaryUnit(accuracy, unit);
	}

	convertTo(unit) {
		throw new Exception("Unsupported unit ${unit}");
	}
	
	op(operator, right) {
		super.op(operator, right);
	}
	
	singleOp(operator) {
		super.singleOp(operator, right);	
	}
}