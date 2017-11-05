import JelType from '../JelType';

/**
 * Represents a boolean type that has, beside clear true and false, also a notion of 'barely true' and 'barely false'.
 */
export default class FuzzyBoolean extends JelType {
	state: number;

	static CLEARLY_FALSE_VALUE = 0;
	static BARELY_FALSE_VALUE = 0.25;
	static HALF_TRUE_VALUE = 0.5;
	static BARLEY_TRUE_VALUE = 0.75;
	static CLEARLY_TRUE_VALUE = 1;

	static CLEARLY_FALSE = new FuzzyBoolean(FuzzyBoolean.CLEARLY_FALSE_VALUE);
	static BARELY_FALSE = new FuzzyBoolean(FuzzyBoolean.BARELY_FALSE_VALUE);
	static HALF_TRUE = new FuzzyBoolean(FuzzyBoolean.HALF_TRUE_VALUE);
	static BARLEY_TRUE = new FuzzyBoolean(FuzzyBoolean.BARLEY_TRUE_VALUE);
	static CLEARLY_TRUE = new FuzzyBoolean(FuzzyBoolean.CLEARLY_TRUE_VALUE);

	// diff optional: can contain the difference that lead to the result, e.g. the length difference if length were compared
	constructor(state: number | boolean, public diff?: number) {
		super();
		if (typeof state == 'boolean')
			this.state = state ? FuzzyBoolean.CLEARLY_TRUE_VALUE : FuzzyBoolean.CLEARLY_FALSE_VALUE;
		else
			this.state = state; // a value 0 - 1
	}
	
	op(operator: string, right: any): any {
		if (right instanceof FuzzyBoolean) {
			switch (operator) {
				case '==': 
					return this.toBoolean() == right.toBoolean();
				case '!=':
					return this.toBoolean() != right.toBoolean();
				case '===':
					return this.state === right.state && JelType.op('==', this.diff, right.diff);
				case '!==':
					return !this.op('===', right);
				case '>':
				case '<':
				case '<=':
				case '>=':
				case '>>':
				case '<<':
				case '<<=':
				case '>>=':
					return JelType.op(operator, this.state, right.state);
			}
		}
		else if (typeof right == 'boolean')
			return JelType.op(operator, this.toBoolean(), right);
		else if (typeof right == 'number')
			return JelType.op(operator, this.state, right);
		return super.op(operator, right);
	}
	
	singleOp(operator: string): any {
		if (operator == '!') 
			return new FuzzyBoolean(FuzzyBoolean.CLEARLY_TRUE_VALUE - this.state, this.diff);
		else
			return JelType.singleOp(operator, this);
	}

	getSerializationProperties(): any[] {
		return this.diff != null ? [this.state, this.diff] : [this.state];
	}
	
	toBoolean_jel_mapping: Object;
	toBoolean(): boolean {
		return this.state >= FuzzyBoolean.HALF_TRUE_VALUE;
	}
	
	static create_jel_mapping = {state: 0, diff: 1};
	static create(...args: any[]): FuzzyBoolean {
		return new FuzzyBoolean(args[0], args[1]);
	}
}

FuzzyBoolean.prototype.toBoolean_jel_mapping = {};


