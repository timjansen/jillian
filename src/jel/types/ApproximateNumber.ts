import JelObject from '../JelObject';
import Runtime from '../Runtime';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Context from '../Context';
import Fraction from './Fraction';
import JelNumber from './JelNumber';
import Numeric from './Numeric';
import JelBoolean from './JelBoolean';


const ACCURACY_FACTOR = 0.999999;  // to avoid rounding issues with fuzzy comparisons


const DEQUAL: any = {'<=': '<', '>=': '>'};

/**
 * Represents a number with given error tolerance.
 */
export default class ApproximateNumber extends JelObject implements Numeric {

	constructor(public value: JelNumber | Fraction, public maxError: JelNumber | Fraction = JelNumber.valueOf(0)) {
		super();
	}
	
	op(ctx: Context, operator: string, right: JelObject): JelObject|Promise<JelObject> {
		if (right instanceof ApproximateNumber) {
			switch (operator) {
				case '==': 
					if ((Runtime.op(ctx, '===', this.value, right.value) as JelBoolean).toRealBoolean())
						return JelBoolean.TRUE;
					const deltaEq = Math.abs(JelNumber.toRealNumber(Runtime.op(ctx, '-', this.value, right.value) as JelObject)) * ACCURACY_FACTOR;
					if (deltaEq == 0)
						return JelBoolean.TRUE;
					const maxErrorDelta = JelNumber.toRealNumber(Runtime.op(ctx, '+', this.maxError, right.maxError));
					if (maxErrorDelta == 0)
						return JelBoolean.FALSE;
					return JelBoolean.create(ctx, Math.max(0, ACCURACY_FACTOR - (0.5*deltaEq / maxErrorDelta)));
				case '===':
				case '>>':
				case '<<':
				case '<<=':
				case '>>=':
					return Runtime.op(ctx, operator, this.value, right.value);
				case '!=':
					return (this.op(ctx, '==', right) as JelBoolean).negate();
				case '!==':
					return (this.op(ctx, '===', right) as JelBoolean).negate();

				case '>':
				case '<':
				case '<=':
				case '>=':
					const maxErrorDeltaCmp = JelNumber.toRealNumber(Runtime.op(ctx, '+', this.maxError, right.maxError));
					if (maxErrorDeltaCmp == 0)
						return Runtime.op(ctx, operator, this.value, right.value)
					const deltaCmp = Math.abs(JelNumber.toRealNumber(Runtime.op(ctx, '-', this.value, right.value))) * ACCURACY_FACTOR;
					if ((Runtime.op(ctx, operator, this.value, right.value) as JelBoolean).toRealBoolean())
						 return (deltaCmp >= maxErrorDeltaCmp) ? JelBoolean.TRUE : JelBoolean.create(ctx, Math.min(ACCURACY_FACTOR, 0.5 + 0.5 * deltaCmp / maxErrorDeltaCmp));
					return (deltaCmp >= maxErrorDeltaCmp) ? JelBoolean.FALSE : JelBoolean.create(ctx, Math.max(0, ACCURACY_FACTOR*0.5 - 0.5 * deltaCmp / maxErrorDeltaCmp));

				case '+':
				case '-':
					return new ApproximateNumber(Runtime.op(ctx, operator, this.value, right.value) as any, Runtime.op(ctx, '+', this.maxError, right.maxError) as any);
				case '*':
				case '/':
					return new ApproximateNumber(Runtime.op(ctx, operator, this.value, right.value) as any, 
																			 Runtime.op(ctx, '+', (Runtime.op(ctx, '*', this.maxError, right.value) as any).abs(), (Runtime.op(ctx, '*', right.maxError, this.value) as any).abs()) as any);
				case '^':
					return new ApproximateNumber(JelNumber.valueOf(Math.pow(JelNumber.toRealNumber(this), JelNumber.toRealNumber(right))), JelNumber.valueOf(Math.pow(JelNumber.toRealNumber(this.maxError), JelNumber.toRealNumber(right))));
				case '+-':
					return new ApproximateNumber(this.value, Runtime.op(ctx, '+', right.value, right.maxError) as any);
			}
		}
		else if (right instanceof JelNumber || right instanceof Fraction) {
			switch (operator) {
				case '==': 
					const maxErrorDelta = JelNumber.toRealNumber(this.maxError);
					const deltaEq = Math.abs(JelNumber.toRealNumber(Runtime.op(ctx, '-', this.value, right) as any)) * ACCURACY_FACTOR;
					if ((Runtime.op(ctx, '===', this.value, right) as JelBoolean).toRealBoolean())
						return JelBoolean.TRUE;
					if (deltaEq == 0)
						return JelBoolean.TRUE;
					else if (maxErrorDelta == 0)
						return JelBoolean.FALSE;
					return JelBoolean.create(ctx, Math.max(0, 1 - (0.5*deltaEq / maxErrorDelta)));
				case '===':
				case '>>':
				case '<<':
				case '<<=':
				case '>>=':
					return Runtime.op(ctx, operator, this.value, right);
				case '!=':
					return (this.op(ctx, '==', right) as JelBoolean).negate();
				case '!==':
					return (Runtime.op(ctx, '===', this.value, right) as JelBoolean).negate();
				case '>':
				case '<':
				case '<=':
				case '>=':
					const maxErrorDeltaCmp = JelNumber.toRealNumber(this.maxError);
					if (maxErrorDeltaCmp == 0)
						return Runtime.op(ctx, operator, this.value, right)
					const deltaCmp = Math.abs(JelNumber.toRealNumber(Runtime.op(ctx, '-', this.value, right) as JelObject)) * ACCURACY_FACTOR;
					if ((Runtime.op(ctx, operator, this.value, right) as JelBoolean).toRealBoolean())
						return (deltaCmp >= maxErrorDeltaCmp) ? JelBoolean.TRUE : JelBoolean.create(ctx, Math.min(ACCURACY_FACTOR, 0.5 + 0.5 * deltaCmp / maxErrorDeltaCmp));
					else
						return (deltaCmp >= maxErrorDeltaCmp) ? JelBoolean.FALSE : JelBoolean.create(ctx, Math.max(0, ACCURACY_FACTOR*0.5 - 0.5 * deltaCmp / maxErrorDeltaCmp));
					
				case '+':
				case '-':
					return new ApproximateNumber(Runtime.op(ctx, operator, this.value, right) as any, this.maxError);
				case '*':
				case '/':
					return new ApproximateNumber(Runtime.op(ctx, operator, this.value, right) as any, (Runtime.op(ctx, '*', this.maxError, right) as any).abs());
				case '^':
					return new ApproximateNumber(JelNumber.valueOf(Math.pow(JelNumber.toRealNumber(this.value), JelNumber.toRealNumber(right))), 
																			 JelNumber.valueOf(Math.pow(JelNumber.toRealNumber(this.maxError), JelNumber.toRealNumber(right))));
				case '+-':
					return new ApproximateNumber(this.value, right);
			}		
		}
		return super.op(ctx, operator, right);
	}
	
	opReversed(ctx: Context, operator: string, left: JelObject): JelObject|Promise<JelObject> {
		if (left instanceof JelNumber) {
			switch (operator) {
				case '-': 
					return new ApproximateNumber(Runtime.op(ctx, operator, left, this.value) as any, this.maxError);
				case '/': 
					return new ApproximateNumber(Runtime.op(ctx, operator, left, this.value) as any, (Runtime.op(ctx, '*', this.maxError, left) as any).abs());
				case '^':
					return JelNumber.valueOf(Math.pow(left.toRealNumber(), this.toRealNumber()));
				case '+-':
					return new ApproximateNumber(left, Runtime.op(ctx, '+', this.value, this.maxError) as any);
			}
		}
		return super.opReversed(ctx, operator, left);
	}
	
	singleOp(ctx: Context, operator: string): JelObject|Promise<JelObject> {
		if (operator == '!')
			return Runtime.singleOp(ctx, operator, this.value);
		else
			return new ApproximateNumber(Runtime.singleOp(ctx, operator, this.value) as any, this.maxError);
	}

	abs_jel_mapping: Object;
	abs(): ApproximateNumber {
		return new ApproximateNumber(this.value.abs(), this.maxError);
	}

	negate_jel_mapping: Object;
	negate(): ApproximateNumber {
		return new ApproximateNumber(this.value.negate(), this.maxError);
	}

	
	toNumber_jel_mapping: Object;
	toNumber(): JelNumber {
		return JelNumber.toNumber(this.value);
	}
	
	toRealNumber(): number {
		return this.value.toRealNumber();
	}
	
	toBoolean(): boolean {
		return this.value.toBoolean();
	}
	
	toString(): string {
		return this.value.toString() + '+-' + this.maxError.toString();
	}
	
	hasError_jel_mapping: Object;
	hasError(): boolean {
		return this.maxError instanceof JelNumber ? this.maxError.value != 0 : this.maxError.numerator != 0;
	}
	
	// for use as ctor
	static fromNumber(a: any, b: any): ApproximateNumber {
		if (!((a instanceof JelNumber || a instanceof Fraction) && (b instanceof JelNumber || b instanceof Fraction)))
			throw new Error('Failed to create ApproximateNumber. Expected both arguments to be numbers');
		return new ApproximateNumber(a, b);
	}

	// for use as ctor
	static createIfError(a: number, b: number): ApproximateNumber | JelNumber {
		return b != 0 ?  new ApproximateNumber(JelNumber.valueOf(a), JelNumber.valueOf(b)) : JelNumber.valueOf(a);
	}

	
	getSerializationProperties(): any[] {
		return this.hasError ? [this.value, this.maxError] : [this.value];
	}
	
	static create_jel_mapping = {value: 1, maxError: 2};
	static create(ctx: Context, ...args: any[]): ApproximateNumber {
		return new ApproximateNumber(args[0], args[1] || 0);
	}
}

ApproximateNumber.prototype.reverseOps = Object.assign({'-':1, '/': 1, '+-': 1, '^': 1}, JelObject.SWAP_OPS);
ApproximateNumber.prototype.toNumber_jel_mapping = {};
ApproximateNumber.prototype.abs_jel_mapping = {};
ApproximateNumber.prototype.negate_jel_mapping = {};
ApproximateNumber.prototype.hasError_jel_mapping = {};

BaseTypeRegistry.register('ApproximateNumber', ApproximateNumber);

