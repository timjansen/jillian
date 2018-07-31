import JelType from '../JelType';
import Fraction from './Fraction';
import FuzzyBoolean from './FuzzyBoolean';


const ACCURACY_FACTOR = 0.999999;  // to avoid rounding issues with fuzzy comparisons

function toNumber(value: number | Fraction): number {
	return typeof value == 'number' ? value : value.toNumber();
}

const DEQUAL: any = {'<=': '<', '>=': '>'};

/**
 * Represents a number with given error tolerance.
 */
export default class ApproximateNumber extends JelType {

	constructor(public value: number | Fraction, public maxError: number | Fraction = 0) {
		super();
	}
	
	op(operator: string, right: any): any {
		if (right instanceof ApproximateNumber) {
			switch (operator) {
				case '==': 
					if (JelType.op('===', this.value, right.value).toRealBoolean())
						return FuzzyBoolean.TRUE;
					const deltaEq = toNumber(JelType.singleOp('abs',JelType.op('-', this.value, right.value))) * ACCURACY_FACTOR;
					if (deltaEq == 0)
						return FuzzyBoolean.TRUE;
					const maxErrorDelta = toNumber(JelType.op('+', this.maxError, right.maxError));
					if (maxErrorDelta == 0)
						return FuzzyBoolean.FALSE;
					return FuzzyBoolean.create(Math.max(0, ACCURACY_FACTOR - (0.5*deltaEq / maxErrorDelta)));
				case '===':
				case '>>':
				case '<<':
				case '<<=':
				case '>>=':
					return JelType.op(operator, this.value, right.value);
				case '!=':
					return this.op('==', right).negate();
				case '!==':
					return this.op('===', right).negate();

				case '>':
				case '<':
				case '<=':
				case '>=':
					const maxErrorDeltaCmp = toNumber(JelType.op('+', this.maxError, right.maxError));
					if (maxErrorDeltaCmp == 0)
						return JelType.op(operator, this.value, right.value)
					const deltaCmp = toNumber(JelType.singleOp('abs', JelType.op('-', this.value, right.value))) * ACCURACY_FACTOR;
					if (JelType.op(operator, this.value, right.value).toRealBoolean())
						 return (deltaCmp >= maxErrorDeltaCmp) ? FuzzyBoolean.TRUE : FuzzyBoolean.create(Math.min(ACCURACY_FACTOR, 0.5 + 0.5 * deltaCmp / maxErrorDeltaCmp));
					return (deltaCmp >= maxErrorDeltaCmp) ? FuzzyBoolean.FALSE : FuzzyBoolean.create(Math.max(0, ACCURACY_FACTOR*0.5 - 0.5 * deltaCmp / maxErrorDeltaCmp));

				case '+':
				case '-':
					return new ApproximateNumber(JelType.op(operator, this.value, right.value), JelType.op('+', this.maxError, right.maxError));
				case '*':
				case '/':
					return new ApproximateNumber(JelType.op(operator, this.value, right.value), 
																			 JelType.op('+', JelType.singleOp('abs', JelType.op('*', this.maxError, right.value)), JelType.singleOp('abs', JelType.op('*', right.maxError, this.value))));
			}
		}
		else if (typeof right == 'number' || right instanceof Fraction) {
			switch (operator) {
				case '==': 
					const maxErrorDelta = toNumber(this.maxError);
					const deltaEq = toNumber(JelType.singleOp('abs',JelType.op('-', this.value, right))) * ACCURACY_FACTOR;
					if (JelType.op('===', this.value, right).toRealBoolean())
						return FuzzyBoolean.TRUE;
					if (deltaEq == 0)
						return FuzzyBoolean.TRUE;
					else if (maxErrorDelta == 0)
						return FuzzyBoolean.FALSE;
					return FuzzyBoolean.create(Math.max(0, 1 - (0.5*deltaEq / maxErrorDelta)));
				case '===':
				case '>>':
				case '<<':
				case '<<=':
				case '>>=':
					return JelType.op(operator, this.value, right);
				case '!=':
					return this.op('==', right).negate();
				case '!==':
					return JelType.op('===', this.value, right).negate();
				case '>':
				case '<':
				case '<=':
				case '>=':
					const maxErrorDeltaCmp = toNumber(this.maxError);
					if (maxErrorDeltaCmp == 0)
						return JelType.op(operator, this.value, right)
					const deltaCmp = toNumber(JelType.singleOp('abs',JelType.op('-', this.value, right))) * ACCURACY_FACTOR;
					if (JelType.op(operator, this.value, right).toRealBoolean())
						 return (deltaCmp >= maxErrorDeltaCmp) ? FuzzyBoolean.TRUE : FuzzyBoolean.create(Math.min(ACCURACY_FACTOR, 0.5 + 0.5 * deltaCmp / maxErrorDeltaCmp));
					return (deltaCmp >= maxErrorDeltaCmp) ? FuzzyBoolean.FALSE : FuzzyBoolean.create(Math.max(0, ACCURACY_FACTOR*0.5 - 0.5 * deltaCmp / maxErrorDeltaCmp));
					
				case '+':
				case '-':
					return new ApproximateNumber(JelType.op(operator, this.value, right), this.maxError);
				case '*':
				case '/':
					return new ApproximateNumber(JelType.op(operator, this.value, right), JelType.singleOp('abs', JelType.op('*', this.maxError, right)));
			}		
		}
		return super.op(operator, right);
	}
	
	opReversed(operator: string, left: any): any {
		if (typeof left == 'number') {
			switch (operator) {
				case '-': 
					return new ApproximateNumber(JelType.op(operator, left, this.value), this.maxError);
				case '/': 
					return new ApproximateNumber(JelType.op(operator, left, this.value), JelType.singleOp('abs', JelType.op('*', this.maxError, left)));
			}
		}
		return super.opReversed(operator, left);
	}
	
	singleOp(operator: string): any {
		if (operator == '!') 
			return FuzzyBoolean.toFuzzyBoolean(this.value == 0);
		else
			return new ApproximateNumber(JelType.singleOp(operator, this.value), this.maxError);
	}

	toNumber_jel_mapping: Object;
	toNumber(): number {
		return toNumber(this.value);
	}
	
	getSerializationProperties(): any[] {
		return this.maxError != 0 ? [this.value, this.maxError] : [this.value];
	}
	
	static create_jel_mapping = {value: 0, maxError: 1};
	static create(...args: any[]): ApproximateNumber {
		return new ApproximateNumber(args[0], args[1]);
	}
}

ApproximateNumber.prototype.reverseOps = {'-':1, '/': 1};
ApproximateNumber.prototype.toNumber_jel_mapping = {};


