import JelObject from '../JelObject';
import Runtime from '../Runtime';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Context from '../Context';
import JelNumber from './JelNumber';
import FuzzyBoolean from './FuzzyBoolean';
/**
 * Represents a fraction.
 */
export default class Fraction extends JelObject {
	numerator: number;
	denominator: number;
	reverseOps: Object;
	
	constructor(numerator: number, denominator: number) {
		super();
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
	
	equals(other: Fraction): boolean {
		return this.numerator === other.numerator && this.denominator === other.denominator;
	}
	
	op(ctx: Context, operator: string, right: JelObject): JelObject|Promise<JelObject> {
		if (right instanceof JelNumber) {
			if (!Number.isInteger(right.value))
				return this.toNumber().op(ctx, operator, right);

			const l = this.simplify();
			if (!(l instanceof Fraction))
				return Runtime.op(ctx, operator, l, right);
			
			switch (operator) {
				case '==':
				case '===':
					return FuzzyBoolean.valueOf(l.numerator === right.value * l.denominator);
				case '!=':
				case '!==':
					return FuzzyBoolean.valueOf(l.numerator !== right.value * l.denominator);
					
				case '<':
				case '<<':
					return FuzzyBoolean.valueOf(l.numerator < right.value * l.denominator);
				case '<=':
				case '<<=':
					return FuzzyBoolean.valueOf(l.numerator <= right.value * l.denominator);
				case '>':
				case '>>':
					return FuzzyBoolean.valueOf(l.numerator > right.value * l.denominator);
				case '>=':
				case '>=':
					return FuzzyBoolean.valueOf(l.numerator >= right.value * l.denominator);
					
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
						return JelNumber.valueOf(1);
					else if (right.value == -1)
						return Fraction.valueOf(this.denominator, this.numerator).simplify();
					else
						return JelNumber.valueOf(Math.pow(this.toRealNumber(), right.value));
				case '+-':
					return BaseTypeRegistry.get('ApproximateNumber').fromNumber(this, right.value);
					
				default:
					return Runtime.op(ctx, operator, this.toNumber(), right);
			}
		}
		else if (right instanceof Fraction) {
			const l: Fraction | JelNumber = this.simplify();
			const r: Fraction | JelNumber = right.simplify();
			if (!((l instanceof Fraction) && (r instanceof Fraction))) {
				if (operator == '/' && l instanceof JelNumber && r instanceof JelNumber)
					return Fraction.valueOf((l as JelNumber).value, (r as JelNumber).value).simplify();
				else 
					return Runtime.op(ctx, operator, l, r);
			}
			
			switch (operator) {
				case '==':
				case '===':
					return FuzzyBoolean.valueOf(l.numerator === r.numerator && l.denominator === r.denominator);
				case '!=':
				case '!==':
					return FuzzyBoolean.valueOf(l.numerator !== r.numerator || l.denominator !== r.denominator);
					
				case '<':
				case '<<':
					return FuzzyBoolean.valueOf(l.numerator*r.denominator < r.numerator*l.denominator);
				case '<=':
				case '<<=':
					return FuzzyBoolean.valueOf(l.numerator*r.denominator <= r.numerator*l.denominator);
				case '>':
				case '>>':
					return FuzzyBoolean.valueOf(l.numerator*r.denominator > r.numerator*l.denominator);
				case '>=':
				case '>>=':
					return FuzzyBoolean.valueOf(l.numerator*r.denominator >= r.numerator*l.denominator);

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
					return Runtime.op(ctx, operator, this.toNumber(), right.toNumber());
			}
		}
		return super.op(ctx, operator, right);
	}

	opReversed(ctx: Context, operator: string, left: JelObject): JelObject|Promise<JelObject> {	
		if (left instanceof JelNumber) {
			const lnum = left.value;
			if (!Number.isInteger(lnum))
				return Runtime.op(ctx, operator, left, this.toNumber());
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
					return JelNumber.valueOf(Math.pow(lnum, this.toRealNumber()));
				case '+-': 
					return BaseTypeRegistry.get('ApproximateNumber').fromNumber(left, this);
			}
		}
		return super.op(ctx, operator, left);
	}

	singleOp(ctx: Context, operator: string): JelObject|Promise<JelObject> {
		switch (operator) {
			case '!':
				return FuzzyBoolean.valueOf(!this.numerator);
			case '-':
				return new Fraction(-this.numerator, this.denominator);
			case '+':
				return this;
			case 'abs':
				return this.numerator >= 0 ? this : new Fraction(Math.abs(this.numerator), this.denominator);
		}
		return super.singleOp(ctx, operator);
	}
	
	toNumber_jel_mapping: Object;
	toNumber(): JelNumber {
		return this.denominator !== 0 ? JelNumber.valueOf(this.numerator / this.denominator) : JelNumber.NAN;
	}

	toRealNumber(): number {
		return this.denominator !== 0 ? this.numerator / this.denominator : NaN;
	}
	
	toBoolean(): FuzzyBoolean {
		return FuzzyBoolean.valueOf(!!this.numerator);
	}
	
	simplify_jel_mapping: Object;
	simplify(): Fraction | JelNumber {
		if (this.denominator == 1)
			return JelNumber.valueOf(this.numerator);
		
		const n = Fraction.gcd(this.numerator, this.denominator);
		if (n == 1)
			return this;
		else if (n == this.denominator)
			return JelNumber.valueOf(this.numerator / this.denominator);
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
	
	static create_jel_mapping = {numerator:1, denominator: 2};
	static create(ctx: Context, ...args: any[]): any {
		return new Fraction(JelNumber.toRealNumber(args[0]), JelNumber.toRealNumber(args[1]));
	}
}

Fraction.prototype.reverseOps = {'-': true, '/': true, '+-': true};
Fraction.prototype.toNumber_jel_mapping = {};
Fraction.prototype.simplify_jel_mapping = {};

BaseTypeRegistry.register('Fraction', Fraction);

