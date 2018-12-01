import Runtime from '../Runtime';
import JelObject from '../JelObject';
import BaseTypeRegistry from '../BaseTypeRegistry';
import SerializablePrimitive from '../SerializablePrimitive';
import Context from '../Context';
import Util from '../../util/Util';
import Numeric from './Numeric';
import JelBoolean from './JelBoolean';
import TypeChecker from './TypeChecker';

/**
 * Represents a number.
 */
export default class JelNumber extends JelObject implements SerializablePrimitive, Numeric {
	
	static readonly NAN = new JelNumber(NaN);
	static readonly DEFAULT_NUMBERS_RANGE = 100;
	static readonly DEFAULT_NUMBERS: JelNumber[] = [];
	
	static init() {
		for (let i = -JelNumber.DEFAULT_NUMBERS_RANGE; i < JelNumber.DEFAULT_NUMBERS_RANGE; i++)
			JelNumber.DEFAULT_NUMBERS.push(new JelNumber(i));
		JelNumber.DEFAULT_NUMBERS[NaN] = JelNumber.NAN;
	}
	
  static typeName = 'Number';
  
	constructor(public value: number) {
		super('Number');
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
					return JelBoolean.valueOf(this.value === right.value);
				case '!=': 
				case '!==': 
					return JelBoolean.valueOf(this.value !== right.value);
				case '<': 
					return JelBoolean.valueOf(this.value < right.value);
				case '<=': 
				case '<<=': 
					return JelBoolean.valueOf(this.value <= right.value);
				case '>': 
				case '>>': 
					return JelBoolean.valueOf(this.value > right.value);
				case '>=': 
				case '>>=': 
					return JelBoolean.valueOf(this.value >= right.value);
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
				return JelBoolean.valueOf(!this.value);
			case '-':
				return this.negate();
			case '+':
				return JelNumber.valueOf(+this.value);
		}
		return super.singleOp(ctx, operator);
	}
	
	negate_jel_mapping: Object;
	negate(): JelNumber {
		return JelNumber.valueOf(-this.value);
	}

	abs_jel_mapping: Object;
	abs(): JelNumber {
		return this.value >= 0 ? this : JelNumber.valueOf(Math.abs(this.value));
	}

	toBoolean(): boolean {
		return !!this.value;
	}

	static toNumber(n: any, defaultValue: any = JelNumber.NAN): any {
		return typeof n == 'number' ? JelNumber.valueOf(n) :(n && (n as any).toNumber) ? (n as any).toNumber() : defaultValue;
	}

	static toRealNumber(n: any, defaultValue: number = NaN): number {
		return typeof n == 'number' ? n : (n && (n as any).toRealNumber) ? (n as any).toRealNumber() : defaultValue;
	}

	static isInteger_jel_mapping: ['n'];
	static isInteger(ctx: Context, n: any): boolean {
		return Number.isInteger(JelNumber.toRealNumber(n));
	}
	
	static toOptionalRealNumber(n: any, defaultValue: number|null = null): number | null {
		return n == null ? null : typeof n == 'number' ? n : (n && (n as any).toRealNumber) ? (n as any).toRealNumber() : defaultValue;
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
JelNumber.prototype.abs_jel_mapping = [];
JelNumber.prototype.negate_jel_mapping = [];

BaseTypeRegistry.register('Number', JelNumber);


