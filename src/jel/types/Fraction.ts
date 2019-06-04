import JelObject from '../JelObject';
import Runtime from '../Runtime';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Context from '../Context';
import NativeJelObject from './NativeJelObject';
import Class from './Class';
import Numeric from './Numeric';
import Float from './Float';
import JelBoolean from './JelBoolean';
import TypeChecker from './TypeChecker';

/**
 * Represents a fraction.
 */
export default class Fraction extends NativeJelObject implements Numeric {
  numerator_jel_property: boolean;
	numerator: number;
  denominator_jel_property: boolean;
	denominator: number;
  
  static clazz: Class|undefined;

	
	constructor(numerator: number, denominator: number) {
		super('Fraction');
		if (denominator < 0) {
			this.numerator = -numerator;
			this.denominator = -denominator;
		}
		else if (denominator > 0) {
			this.numerator = numerator; 
			this.denominator = denominator; 
		}
		else 
			throw Error("Denominator in Fraction must not be 0");
	}
  
	get clazz(): Class {
		return Fraction.clazz!;
	}
	
	equals(other: Fraction): boolean {
		return this.numerator === other.numerator && this.denominator === other.denominator;
	}
	
	op(ctx: Context, operator: string, right: JelObject, isReversal: boolean = false): JelObject|Promise<JelObject> {
		if (right instanceof Float) {
			if (!Number.isInteger(right.value))
				return this.toFloat().op(ctx, operator, right);

			const l = this.simplify();
			if (!(l instanceof Fraction))
				return Runtime.op(ctx, operator, l, right);
			
			switch (operator) {
				case '==':
				case '===':
					return JelBoolean.valueOf(l.numerator === right.value * l.denominator);
				case '!=':
				case '!==':
					return JelBoolean.valueOf(l.numerator !== right.value * l.denominator);
					
				case '<':
				case '<<':
					return JelBoolean.valueOf(l.numerator < right.value * l.denominator);
				case '<=':
				case '<<=':
					return JelBoolean.valueOf(l.numerator <= right.value * l.denominator);
				case '>':
				case '>>':
					return JelBoolean.valueOf(l.numerator > right.value * l.denominator);
				case '>=':
				case '>=':
					return JelBoolean.valueOf(l.numerator >= right.value * l.denominator);
					
				case '+':
					return Fraction.valueOf(l.numerator + right.value*l.denominator, l.denominator).simplify();
				case '-':
					return Fraction.valueOf(l.numerator - right.value*l.denominator, l.denominator).simplify();
				case '*':
					return Fraction.valueOf(l.numerator * right.value, l.denominator).simplify();
				case '/':
					return Fraction.valueOf(l.numerator, l.denominator*right.value).simplify();
					
				case '^': 
					if (Number.isInteger(right.value) && right.value > 0) 
						return Fraction.valueOf(Math.pow(this.numerator, right.value), Math.pow(this.denominator, right.value)).simplify();
					else if (right.value == 0)
						return Float.valueOf(1);
					else if (right.value == -1)
						return Fraction.valueOf(this.denominator, this.numerator).simplify();
					else
						return Float.valueOf(Math.pow(this.toRealNumber(), right.value));
				case '+-':
					return BaseTypeRegistry.get('ApproximateNumber').fromNumber(this, right);
					
				default:
					return Runtime.op(ctx, operator, this.toFloat(), right);
			}
		}
		else if (right instanceof Fraction) {
			const l: Fraction | Float = this.simplify();
			const r: Fraction | Float = right.simplify();
			if (!((l instanceof Fraction) && (r instanceof Fraction))) {
				if (operator == '/' && l instanceof Float && r instanceof Float)
					return Fraction.valueOf((l as Float).value, (r as Float).value).simplify();
				else 
					return Runtime.op(ctx, operator, l, r);
			}
			
			switch (operator) {
				case '==':
				case '===':
					return JelBoolean.valueOf(l.numerator === r.numerator && l.denominator === r.denominator);
				case '!=':
				case '!==':
					return JelBoolean.valueOf(l.numerator !== r.numerator || l.denominator !== r.denominator);
					
				case '<':
				case '<<':
					return JelBoolean.valueOf(l.numerator*r.denominator < r.numerator*l.denominator);
				case '<=':
				case '<<=':
					return JelBoolean.valueOf(l.numerator*r.denominator <= r.numerator*l.denominator);
				case '>':
				case '>>':
					return JelBoolean.valueOf(l.numerator*r.denominator > r.numerator*l.denominator);
				case '>=':
				case '>>=':
					return JelBoolean.valueOf(l.numerator*r.denominator >= r.numerator*l.denominator);

				case '+':
					return Fraction.valueOf((l.numerator*r.denominator)+(r.numerator*l.denominator), l.denominator*r.denominator).simplify();
				case '-':
					return Fraction.valueOf((l.numerator*r.denominator)-(r.numerator*l.denominator), l.denominator*r.denominator).simplify();
				case '*':
					return Fraction.valueOf(l.numerator*r.numerator, l.denominator*r.denominator).simplify();
				case '/':
					return Fraction.valueOf(l.numerator*r.denominator, l.denominator*r.numerator).simplify();
				case '+-':
					return BaseTypeRegistry.get('ApproximateNumber').fromNumber(this, right);

				default:
					return Runtime.op(ctx, operator, this.toFloat(), right.toFloat());
			}
		}
		return super.op(ctx, operator, right, isReversal);
	}

	opReversed(ctx: Context, operator: string, left: JelObject): JelObject|Promise<JelObject> {	
		if (left instanceof Float) {
			const lnum = left.value;
			if (!Number.isInteger(lnum))
				return Runtime.op(ctx, operator, left, this.toFloat());
			switch (operator) {
				case '+':
					return Fraction.valueOf(lnum*this.denominator+this.numerator, this.denominator).simplify();
				case '-':
					return Fraction.valueOf(lnum*this.denominator-this.numerator, this.denominator).simplify();
				case '*':
					return Fraction.valueOf(lnum*this.numerator, this.denominator).simplify();
				case '/':
					return Fraction.valueOf(lnum*this.denominator, this.numerator).simplify();
				case '^':
					return Float.valueOf(Math.pow(lnum, this.toRealNumber()));
				case '+-': 
					return BaseTypeRegistry.get('ApproximateNumber').fromNumber(left, this);
			}
		}
		return super.opReversed(ctx, operator, left);
	}

	singleOp(ctx: Context, operator: string): JelObject|Promise<JelObject> {
		switch (operator) {
			case '!':
				return JelBoolean.valueOf(!this.numerator);
			case '-':
				return new Fraction(-this.numerator, this.denominator);
			case '+':
				return this;
		}
		return super.singleOp(ctx, operator);
	}
	
	abs_jel_mapping: Object;
	abs(): Fraction {
		return this.numerator >= 0 ? this : new Fraction(Math.abs(this.numerator), this.denominator);
	}

	negate_jel_mapping: Object;
	negate(): Fraction {
		return new Fraction(-this.numerator, this.denominator);
	}

	toFloat_jel_mapping: Object;
	toFloat(): Float {
		return this.denominator !== 0 ? Float.valueOf(this.numerator / this.denominator) : Float.NAN;
	}

 	round_jel_mapping: Object;
	round(ctx: Context): Float {
		return Float.valueOf(Math.round(this.toFloat().value));
	}
	
	trunc_jel_mapping: Object;
	trunc(): Float {
		return Float.valueOf(Math.trunc(this.toFloat().value));
	}

	toRealNumber(): number {
		return this.denominator !== 0 ? this.numerator / this.denominator : NaN;
	}
	
	toString(): string {
		return this.numerator+'/'+this.denominator;
	}
	
	simplify_jel_mapping: Object;
	simplify(): Fraction | Float {
		if (this.denominator == 1)
			return Float.valueOf(this.numerator);
		
		const n = Fraction.gcd(this.numerator, this.denominator);
		if (n == 1)
			return this;
		else if (n == this.denominator)
			return Float.valueOf(this.numerator / this.denominator);
		else
			return Fraction.valueOf(this.numerator / n, this.denominator / n); 
	}
	
	getSerializationProperties(): any[] {
		return [this.numerator, this.denominator];
	}
	
	static valueOf(a: number, b: number): Fraction {
		return new Fraction(a, b);
	}
	
	static gcd(a: number, b: number): number {
		let a0 = Math.abs(a)
		let b0 = Math.abs(b);
		let t;
		while (b0 !== 0) {
			t = b0;
			b0 = a0 % b0;
			a0 = t;
		}
		return a0; 
 	}
	
	static create_jel_mapping = ['numerator', 'denominator'];
	static create(ctx: Context, ...args: any[]): any {
		return new Fraction(TypeChecker.realNumber(args[0], 'numerator'), TypeChecker.realNumber(args[1], 'denominator'));
	}
}

Fraction.prototype.numerator_jel_property = true;
Fraction.prototype.denominator_jel_property = true;

Fraction.prototype.reverseOps = Object.assign({'-': true, '/': true, '+-': true, '^': true}, JelObject.SWAP_OPS);
Fraction.prototype.abs_jel_mapping = true;
Fraction.prototype.negate_jel_mapping = true;
Fraction.prototype.toFloat_jel_mapping = true;
Fraction.prototype.simplify_jel_mapping = true;
Fraction.prototype.round_jel_mapping = true;
Fraction.prototype.trunc_jel_mapping = true;


BaseTypeRegistry.register('Fraction', Fraction);

