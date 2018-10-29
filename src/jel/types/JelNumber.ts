import Runtime from '../Runtime';
import JelObject from '../JelObject';
import BaseTypeRegistry from '../BaseTypeRegistry';
import SerializablePrimitive from '../SerializablePrimitive';
import Context from '../Context';
import Util from '../../util/Util';
import FuzzyBoolean from './FuzzyBoolean';

/**
 * Represents a number.
 */
export default class JelNumber extends JelObject implements SerializablePrimitive {
	
	static readonly NAN = new JelNumber(NaN);
	static readonly DEFAULT_NUMBERS_RANGE = 100;
	static readonly DEFAULT_NUMBERS: JelNumber[] = [];
	
	static init() {
		for (let i = -JelNumber.DEFAULT_NUMBERS_RANGE; i < JelNumber.DEFAULT_NUMBERS_RANGE; i++)
			JelNumber.DEFAULT_NUMBERS.push(new JelNumber(i));
		JelNumber.DEFAULT_NUMBERS[NaN] = JelNumber.NAN;
	}
	
	constructor(public value: number) {
		super();
	}
	
	op(ctx: Context, operator: string, right: JelObject): JelObject|Promise<JelObject> {
		if (right instanceof JelNumber) {
			switch (operator) {
				case '+': 
					return JelNumber.valueOf(this.value + right.value);
				case '-': 
					return JelNumber.valueOf(this.value - right.value);
				case '*': 
					return JelNumber.valueOf(this.value * right.value);
				case '/': 
					return JelNumber.valueOf(this.value / right.value);
				case '%': 
					return JelNumber.valueOf(((this.value % right.value) + right.value) % right.value);
				case '^': 
					return JelNumber.valueOf(Math.pow(this.value, right.value));
				case '==': 
				case '===': 
					return FuzzyBoolean.valueOf(this.value === right.value);
				case '!=': 
				case '!==': 
					return FuzzyBoolean.valueOf(this.value !== right.value);
				case '<': 
					return FuzzyBoolean.valueOf(this.value < right.value);
				case '<=': 
				case '<<=': 
					return FuzzyBoolean.valueOf(this.value <= right.value);
				case '>': 
				case '>>': 
					return FuzzyBoolean.valueOf(this.value > right.value);
				case '>=': 
				case '>>=': 
					return FuzzyBoolean.valueOf(this.value >= right.value);
				case '+-': 
					return BaseTypeRegistry.get('ApproximateNumber').fromNumber(this, right);
			};
		}
		return super.op(ctx, operator, right);
	}
	
	static valueOf(n: number): JelNumber {
		return JelNumber.DEFAULT_NUMBERS[n + JelNumber.DEFAULT_NUMBERS_RANGE] || new JelNumber(n);
	}
	
	singleOp(ctx: Context, operator: string): JelObject|Promise<JelObject> {
		switch(operator) {
			case '!':
				return FuzzyBoolean.valueOf(!this.value);
			case '-':
				return this.negate();
			case '+':
				return JelNumber.valueOf(+this.value);
			case 'abs':
				return JelNumber.valueOf(Math.abs(this.value));
		}
		return super.singleOp(ctx, operator);
	}
	
	negate(): JelNumber {
		return JelNumber.valueOf(-this.value);
	}


	toBoolean(): FuzzyBoolean {
		return FuzzyBoolean.valueOf(!!this.value);
	}

	static toNumber(n: number|JelObject|null, defaultValue: any = JelNumber.NAN): any {
		return typeof n == 'number' ? JelNumber.valueOf(n) :(n && (n as any).toNumber) ? (n as any).toNumber() : defaultValue;
	}

	static toRealNumber(n: any, defaultValue: number = NaN): number {
		return typeof n == 'number' ? n : (n && (n as any).toRealNumber) ? (n as any).toRealNumber() : defaultValue;
	}
	
	static toNumberWithPromise(n: any | Promise<any>): any | Promise<any> {
		return Util.resolveValue(n, JelNumber.toNumber);
	}

	toString(): string {
		return this.value.toString();
	}

	toNumber(): JelNumber {
		return this;
	}
	
	toRealNumber(): number {
		return this.value;
	}
	
	getSerializationProperties(): any[] {
		return [this.value];
	}

	serializeToString(pretty: boolean, indent: number, spaces: string) : string {
		return JSON.stringify(this.value);
	}

}

JelNumber.init();
JelNumber.prototype.reverseOps = {
	'+': 1,
	'*': 1,
	'==': 1,
	'!=': 1,
	'===': 1,
	'!==': 1,
	'>': 1,
	'>>': 1,
	'<': 1,
	'<<': 1,
	'>=': 1,
	'>>=': 1,
	'<=': 1,
	'<<=': 1,
};

BaseTypeRegistry.register('JelNumber', JelNumber);


