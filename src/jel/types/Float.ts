import Runtime from '../Runtime';
import JelObject from '../JelObject';
import BaseTypeRegistry from '../BaseTypeRegistry';
import SerializablePrimitive from '../SerializablePrimitive';
import NativeJelObject from './NativeJelObject';
import Class from './Class';
import Context from '../Context';
import Util from '../../util/Util';
import Numeric from './Numeric';
import JelBoolean from './JelBoolean';
import TypeChecker from './TypeChecker';

/**
 * Represents a number.
 */
export default class Float extends NativeJelObject implements SerializablePrimitive, Numeric {
	
	static readonly NAN = new Float(NaN);
	static readonly DEFAULT_NUMBERS_RANGE = 100;
	static readonly DEFAULT_NUMBERS: Float[] = [];
	
	static init() {
		for (let i = -Float.DEFAULT_NUMBERS_RANGE; i < Float.DEFAULT_NUMBERS_RANGE; i++)
			Float.DEFAULT_NUMBERS.push(new Float(i));
		Float.DEFAULT_NUMBERS[NaN] = Float.NAN;
	}
	
 	static jelName = 'Float';
  
 	static clazz: Class|undefined;

  
	constructor(public value: number) {
		super('Float');
	}
  
 	get clazz(): Class {
		return Float.clazz!;
	}
	  
  
	op(ctx: Context, operator: string, right: JelObject, isReversal: boolean = false): JelObject|Promise<JelObject> {
		if (right instanceof Float) {
			switch (operator) {
				case '+': 
					return Float.valueOf(this.value + right.value);
				case '-': 
					return Float.valueOf(this.value - right.value);
				case '*': 
					return Float.valueOf(this.value * right.value);
				case '/': 
					return Float.valueOf(this.value / right.value);
				case '%': 
					return Float.valueOf(((this.value % right.value) + right.value) % right.value);
				case '^': 
					return Float.valueOf(Math.pow(this.value, right.value));
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
		return super.op(ctx, operator, right, isReversal);
	}

	add(right: any) {
		if (right instanceof Float) return Float.valueOf(this.value + right.value);
	}
	
	static valueOf(n: number): Float {
		return Float.DEFAULT_NUMBERS[n + Float.DEFAULT_NUMBERS_RANGE] || new Float(n);
	}
	
	singleOp(ctx: Context, operator: string): JelObject|Promise<JelObject> {
		switch(operator) {
			case '!':
				return JelBoolean.valueOf(!this.value);
			case '-':
				return this.negate();
			case '+':
				return Float.valueOf(+this.value);
		}
		return super.singleOp(ctx, operator);
	}
	
	negate_jel_mapping: Object;
	negate(): Float {
		return Float.valueOf(-this.value);
	}

	abs_jel_mapping: Object;
	abs(): Float {
		return this.value >= 0 ? this : Float.valueOf(Math.abs(this.value));
	}

	round_jel_mapping: Object;
	round(ctx: Context): Float {
		return Float.valueOf(Math.round(this.value));
	}
	
	trunc_jel_mapping: Object;
	trunc(): Float {
		return Float.valueOf(Math.trunc(this.value));
	}

	isInteger_jel_mapping: Object;
	isInteger(): boolean {
		return Number.isInteger(this.value);
	}

  
	static toFloat(n: any, defaultValue: any = Float.NAN): any {
		return typeof n == 'number' ? Float.valueOf(n) :(n && (n as any).toFloat) ? (n as any).toFloat() : defaultValue;
	}

	static toRealNumber(n: any, defaultValue: number = NaN): number {
		return typeof n == 'number' ? n : (n && (n as any).toRealNumber) ? (n as any).toRealNumber() : defaultValue;
	}

	static isInteger_jel_mapping = true;
	static isInteger(ctx: Context, n: any): boolean {
		return Number.isInteger(Float.toRealNumber(n));
	}

	static isNumeric_jel_mapping = true;
	static isNumeric(ctx: Context, n: JelObject|null): boolean {
		return n && (n as any).toFloat;
	}

  	static noUnit_jel_mapping = true;
	static noUnit(ctx: Context, n: JelObject|null): boolean {
		return n && (n as any).toFloat && n.className != 'UnitValue';
	}

	static toOptionalRealNumber(n: any, defaultValue: number|null = null): number | null {
		return n == null ? null : typeof n == 'number' ? n : (n && (n as any).toRealNumber) ? (n as any).toRealNumber() : defaultValue;
	}
	
	static toFloatWithPromise(n: any | Promise<any>): any | Promise<any> {
		return Util.resolveValue(n, Float.toFloat);
	}

	toString(): string {
		return this.value.toString();
	}

	toFloat(): Float {
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

Float.init();
Float.prototype.abs_jel_mapping = true;
Float.prototype.negate_jel_mapping = true;
Float.prototype.round_jel_mapping = true;
Float.prototype.trunc_jel_mapping = true;
Float.prototype.isInteger_jel_mapping = true;

BaseTypeRegistry.register('Float', Float);


