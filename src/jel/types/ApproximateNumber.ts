import JelType from '../JelType';
import Context from '../Context';
import Fraction from './Fraction';
import FuzzyBoolean from './FuzzyBoolean';


const ACCURACY_FACTOR = 0.999999;  // to avoid rounding issues with fuzzy comparisons


const DEQUAL: any = {'<=': '<', '>=': '>'};

/**
 * Represents a number with given error tolerance.
 */
export default class ApproximateNumber extends JelType {

	constructor(public value: number | Fraction, public maxError: number | Fraction = 0) {
		super();
	}
	
	op(ctx: Context, operator: string, right: any): any {
		if (right instanceof ApproximateNumber) {
			switch (operator) {
				case '==': 
					if (JelType.op(ctx, '===', this.value, right.value).toRealBoolean())
						return FuzzyBoolean.TRUE;
					const deltaEq = JelType.toNumber(JelType.singleOp(ctx, 'abs',JelType.op(ctx, '-', this.value, right.value))) * ACCURACY_FACTOR;
					if (deltaEq == 0)
						return FuzzyBoolean.TRUE;
					const maxErrorDelta = JelType.toNumber(JelType.op(ctx, '+', this.maxError, right.maxError));
					if (maxErrorDelta == 0)
						return FuzzyBoolean.FALSE;
					return FuzzyBoolean.create(ctx, Math.max(0, ACCURACY_FACTOR - (0.5*deltaEq / maxErrorDelta)));
				case '===':
				case '>>':
				case '<<':
				case '<<=':
				case '>>=':
					return JelType.op(ctx, operator, this.value, right.value);
				case '!=':
					return this.op(ctx, '==', right).negate();
				case '!==':
					return this.op(ctx, '===', right).negate();

				case '>':
				case '<':
				case '<=':
				case '>=':
					const maxErrorDeltaCmp = JelType.toNumber(JelType.op(ctx, '+', this.maxError, right.maxError));
					if (maxErrorDeltaCmp == 0)
						return JelType.op(ctx, operator, this.value, right.value)
					const deltaCmp = JelType.toNumber(JelType.singleOp(ctx, 'abs', JelType.op(ctx, '-', this.value, right.value))) * ACCURACY_FACTOR;
					if (JelType.op(ctx, operator, this.value, right.value).toRealBoolean())
						 return (deltaCmp >= maxErrorDeltaCmp) ? FuzzyBoolean.TRUE : FuzzyBoolean.create(ctx, Math.min(ACCURACY_FACTOR, 0.5 + 0.5 * deltaCmp / maxErrorDeltaCmp));
					return (deltaCmp >= maxErrorDeltaCmp) ? FuzzyBoolean.FALSE : FuzzyBoolean.create(ctx, Math.max(0, ACCURACY_FACTOR*0.5 - 0.5 * deltaCmp / maxErrorDeltaCmp));

				case '+':
				case '-':
					return new ApproximateNumber(JelType.op(ctx, operator, this.value, right.value), JelType.op(ctx, '+', this.maxError, right.maxError));
				case '*':
				case '/':
					return new ApproximateNumber(JelType.op(ctx, operator, this.value, right.value), 
																			 JelType.op(ctx, '+', JelType.singleOp(ctx, 'abs', JelType.op(ctx, '*', this.maxError, right.value)), JelType.singleOp(ctx, 'abs', JelType.op(ctx, '*', right.maxError, this.value))));
				case '^':
					return new ApproximateNumber(Math.pow(this.toNumber(), right.toNumber()), Math.pow(JelType.toNumber(this.maxError), right.toNumber()));
				case '+-':
					return new ApproximateNumber(this.value, JelType.op(ctx, '+', right.value, right.maxError));
			}
		}
		else if (typeof right == 'number' || right instanceof Fraction) {
			switch (operator) {
				case '==': 
					const maxErrorDelta = JelType.toNumber(this.maxError);
					const deltaEq = JelType.toNumber(JelType.singleOp(ctx, 'abs',JelType.op(ctx, '-', this.value, right))) * ACCURACY_FACTOR;
					if (JelType.op(ctx, '===', this.value, right).toRealBoolean())
						return FuzzyBoolean.TRUE;
					if (deltaEq == 0)
						return FuzzyBoolean.TRUE;
					else if (maxErrorDelta == 0)
						return FuzzyBoolean.FALSE;
					return FuzzyBoolean.create(ctx, Math.max(0, 1 - (0.5*deltaEq / maxErrorDelta)));
				case '===':
				case '>>':
				case '<<':
				case '<<=':
				case '>>=':
					return JelType.op(ctx, operator, this.value, right);
				case '!=':
					return this.op(ctx, '==', right).negate();
				case '!==':
					return JelType.op(ctx, '===', this.value, right).negate();
				case '>':
				case '<':
				case '<=':
				case '>=':
					const maxErrorDeltaCmp = JelType.toNumber(this.maxError);
					if (maxErrorDeltaCmp == 0)
						return JelType.op(ctx, operator, this.value, right)
					const deltaCmp = JelType.toNumber(JelType.singleOp(ctx, 'abs',JelType.op(ctx, '-', this.value, right))) * ACCURACY_FACTOR;
					if (JelType.op(ctx, operator, this.value, right).toRealBoolean())
						 return (deltaCmp >= maxErrorDeltaCmp) ? FuzzyBoolean.TRUE : FuzzyBoolean.create(ctx, Math.min(ACCURACY_FACTOR, 0.5 + 0.5 * deltaCmp / maxErrorDeltaCmp));
					return (deltaCmp >= maxErrorDeltaCmp) ? FuzzyBoolean.FALSE : FuzzyBoolean.create(ctx, Math.max(0, ACCURACY_FACTOR*0.5 - 0.5 * deltaCmp / maxErrorDeltaCmp));
					
				case '+':
				case '-':
					return new ApproximateNumber(JelType.op(ctx, operator, this.value, right), this.maxError);
				case '*':
				case '/':
					return new ApproximateNumber(JelType.op(ctx, operator, this.value, right), JelType.singleOp(ctx, 'abs', JelType.op(ctx, '*', this.maxError, right)));
				case '^':
					return new ApproximateNumber(Math.pow(JelType.toNumber(this.value), JelType.toNumber(right)), 
																			 Math.pow(JelType.toNumber(this.maxError), JelType.toNumber(right)));
				case '+-':
					return new ApproximateNumber(this.value, right);
			}		
		}
		return super.op(ctx, operator, right);
	}
	
	opReversed(ctx: Context, operator: string, left: any): any {
		if (typeof left == 'number') {
			switch (operator) {
				case '-': 
					return new ApproximateNumber(JelType.op(ctx, operator, left, this.value), this.maxError);
				case '/': 
					return new ApproximateNumber(JelType.op(ctx, operator, left, this.value), JelType.singleOp(ctx, 'abs', JelType.op(ctx, '*', this.maxError, left)));
				case '^':
					return Math.pow(left, this.toNumber());
				case '+-':
					return new ApproximateNumber(left, JelType.op(ctx, '+', this.value, this.maxError));
			}
		}
		return super.opReversed(ctx, operator, left);
	}
	
	singleOp(ctx: Context, operator: string): any {
		if (operator == '!')
			return JelType.singleOp(ctx, operator, this.value);
		else if (operator == 'abs')
			return JelType.singleOp(ctx, operator, this.value);
		else
			return new ApproximateNumber(JelType.singleOp(ctx, operator, this.value), this.maxError);
	}

	toNumber_jel_mapping: Object;
	toNumber(): number {
		return JelType.toNumber(this.value);
	}
	
	toBoolean(): FuzzyBoolean {
		return FuzzyBoolean.toFuzzyBoolean(!!this.toNumber());
	}
	
	static fromNumber(a: any, b: any): ApproximateNumber {
		if (typeof a != 'number' || typeof b != 'number')
			throw new Error('Failed to create ApproximateNumber. Expected both arguments to be numbers');
		return new ApproximateNumber(a, b);
	}
	
	getSerializationProperties(): any[] {
		return this.maxError != 0 ? [this.value, this.maxError] : [this.value];
	}
	
	static create_jel_mapping = {value: 1, maxError: 2};
	static create(ctx: Context, ...args: any[]): ApproximateNumber {
		return new ApproximateNumber(args[0], args[1]);
	}
}

ApproximateNumber.prototype.reverseOps = {'-':1, '/': 1, '+-': 1};
ApproximateNumber.prototype.toNumber_jel_mapping = {};

JelType.setApproximateNumber(ApproximateNumber);



