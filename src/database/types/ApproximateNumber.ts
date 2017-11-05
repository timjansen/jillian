import JelType from '../../jel/JelType';
import Fraction from './Fraction';
import FuzzyBoolean from './FuzzyBoolean';


const ACCURACY_FACTOR = 0.9999999;  // to avoid rounding issues with fuzzy comparisons

function toNumber(value: number | Fraction): number {
	return typeof value == 'number' ? value : value.toNumber();
}

function toBoolean(value: boolean | FuzzyBoolean): boolean {
	return typeof value == 'boolean' ? value : value.toBoolean();
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
			const maxErrorDelta = toNumber(JelType.op('+', this.maxError, right.maxError)) * ACCURACY_FACTOR;
			switch (operator) {
				case '==': 
					if (JelType.op('===', this.value, right.value))
						return true;
					const deltaEq = toNumber(JelType.singleOp('abs',JelType.op('-', this.value, right.value)));
					if (deltaEq == 0)
						return true;
					else if (maxErrorDelta == 0)
						return false;
					return new FuzzyBoolean(Math.max(0, 1 - (0.5*deltaEq / maxErrorDelta)));
				case '===':
					return JelType.op('===', this.value, right.value);
				case '!=':
					return JelType.singleOp('!', this.op('==', right));
				case '!==':
					return JelType.singleOp('!', this.op('===', right));

				case '>':
				case '<':
					const deltaCmp = toNumber(JelType.singleOp('abs',JelType.op('-', this.value, right.value)));
					if (JelType.op(operator, this.value, right.value))
						 return (deltaCmp >= maxErrorDelta) ? true : new FuzzyBoolean(1 - deltaCmp / maxErrorDelta);
					return (deltaCmp >= maxErrorDelta) ? false : new FuzzyBoolean(Math.max(0, 0.5 - deltaCmp / maxErrorDelta));
				case '<=':
				case '>=':
					const eq = JelType.op('=', this, right);
					return toBoolean(eq) ? eq : JelType.op(DEQUAL[operator], this, right);
				case '>>':
				case '<<':
				case '<<=':
				case '>>=':
					return JelType.op(operator, this.value, right.value);

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
			const maxErrorDelta = toNumber(this.maxError) * ACCURACY_FACTOR;
			switch (operator) {
				case '==': 
					if (JelType.op('===', this.value, right))
						return true;
					const deltaEq = toNumber(JelType.singleOp('abs',JelType.op('-', this.value, right)));
					if (deltaEq == 0)
						return true;
					else if (maxErrorDelta == 0)
						return false;
					return new FuzzyBoolean(Math.max(0, 1 - (0.5*deltaEq / maxErrorDelta)));
				case '===':
					return JelType.op('===', this.value, right);
				case '!=':
					return JelType.singleOp('!', this.op('==', right));
				case '!==':
					return JelType.singleOp('!', this.op('===', right));
				case '>':
				case '<':
					const deltaCmp = toNumber(JelType.singleOp('abs',JelType.op('-', this.value, right)));
					if (JelType.op(operator, this.value, right))
						 return (deltaCmp >= maxErrorDelta) ? true : new FuzzyBoolean(1 - deltaCmp / maxErrorDelta);
					return (deltaCmp >= maxErrorDelta) ? false : new FuzzyBoolean(Math.max(0, 0.5 - deltaCmp / maxErrorDelta));
				case '<=':
				case '>=':
					const eq = JelType.op('=', this, right);
					return toBoolean(eq) ? eq : JelType.op(DEQUAL[operator], this, right);
				case '>>':
				case '<<':
				case '<<=':
				case '>>=':
					return JelType.op(operator, this.value, right);
					
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
	
	singleOp(operator: string): any {
		if (operator == '!') 
			return this.value == 0;
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
	static create(...args: any[]): FuzzyBoolean {
		return new FuzzyBoolean(args[0], args[1]);
	}
}

ApproximateNumber.prototype.toNumber_jel_mapping = {};


