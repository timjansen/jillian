import JelType from '../../jel/JelType';

/**
 * Represents a boolean type that has, beside clear true and false, also a notion of 'barely true' and 'barely false'.
 */
export default class FuzzyBoolean extends JelType {
	state: number;

	static CLEARLY_FALSE = 0;
	static BARELY_FALSE = 0.25;
	static HALF_TRUE = 0.5;
	static BARLEY_TRUE = 0.75;
	static CLEARLY_TRUE = 1;


	// diff optional: can contain the difference that lead to the result, e.g. the length difference if length were compared
	constructor(state: number | boolean, public diff?: number) {
		super();
		if (typeof state == 'boolean')
			this.state = state ? FuzzyBoolean.CLEARLY_TRUE : FuzzyBoolean.CLEARLY_FALSE;
		else
			this.state = state; // *_TRUE or *_FALSE, or a value 0-1
		
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
			return new FuzzyBoolean(FuzzyBoolean.CLEARLY_TRUE - this.state, this.diff);
		else
			return JelType.singleOp(operator, this);
	}

	getSerializationProperties(): any[] {
		return this.diff != null ? [this.state, this.diff] : [this.state];
	}
	
	toBoolean_jel_mapping: Object;
	toBoolean(): boolean {
		return this.state >= FuzzyBoolean.HALF_TRUE;
	}
	
	static create_jel_mapping = {state: 0, diff: 1};
	static create(...args: any[]): FuzzyBoolean {
		return new FuzzyBoolean(args[0], args[1]);
	}
}

FuzzyBoolean.prototype.toBoolean_jel_mapping = {};


