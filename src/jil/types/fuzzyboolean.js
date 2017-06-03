
/**
 * Represents a boolean type that has, beside clear true and false, also a notion of 'barely true' and 'barely false'.
 * Ranges can be open-ended by passing a null for the min and/or max.
 */
class FuzzyBoolean extends JelType {
	constructor(state, diff) {
		super();
		if (typeof state == 'boolean')
			this.state = state ? FuzzyBoolean.CLEARLY_TRUE : FuzzyBoolean.CLEARLY_FALSE;
		else
			this.state = state; // *_TRUE of *_FALSE
		this.diff = diff;     // optional: can contain the difference that lead to the result, e.g. the length difference if length were compared
	}
	
	op(operator, right) {
		if (right instanceof FuzzyBoolean) {
			switch (operator) {
				case '==': 
					return this.toBoolean() == right.toBoolean();
				case '!=':
					return this.toBoolean() != right.toBoolean();
				case '===':
					return this.state === right.state;
				case '!==':
					return this.state !== right.state;
				case '>':
				case '<':
				case '<=':
				case '>=':
					return Type.op(operator, this.state, right.state);
			}
		}
		else if (typeof right == 'boolean')
			return Type.op(operator, this.toBoolean(), right);
		super.op(operator, right);
	}
	
	singleOp(operator) {
		if (operator == '!') 
			return new FuzzyBoolean(FuzzyBoolean.CLEARLY_TRUE - this.state, this.diff);
		else
			return Type.singleOp(operator);
	}

	toBoolean() {
		return this.state >= FuzzyBoolean.BARELY_TRUE;
	}
	
	static create(state, diff) {
		return new FuzzyBoolean(state, diff);
	}
}

FuzzyBoolean.CLEARLY_FALSE = 0;
FuzzyBoolean.BARELY_FALSE = 1;
FuzzyBoolean.BARLEY_TRUE = 2;
FuzzyBoolean.CLEARLY_TRUE = 3;

FuzzyBoolean.create_jel_mapping = ['state', 'diff'];


		