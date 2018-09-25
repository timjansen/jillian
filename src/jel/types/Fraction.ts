import JelType from '../JelType';
import Context from '../Context';
import FuzzyBoolean from './FuzzyBoolean';

/**
 * Represents a fraction.
 */
export default class Fraction extends JelType {
	numerator: number;
	denominator: number;
	reverseOps: Object;
	// mixed: // if true, number should be displayed with integer, like   3 1/2 instead of 7/2
	
	constructor(numerator: number, denominator: number, public mixed = true) {
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
	
	op(ctx: Context, operator: string, right: any): any {
		if (typeof right == 'number') {
			if (!Number.isInteger(right))
				return JelType.op(ctx, operator, this.toNumber(), right);

			const l = this.simplify();
			if (!(l instanceof Fraction))
				return JelType.op(ctx, operator, l, right);
			
			switch (operator) {
				case '==':
				case '===':
					return FuzzyBoolean.toFuzzyBoolean(l.numerator === right * l.denominator);
				case '!=':
				case '!==':
					return FuzzyBoolean.toFuzzyBoolean(l.numerator !== right * l.denominator);
					
				case '<':
				case '<<':
					return FuzzyBoolean.toFuzzyBoolean(l.numerator < right * l.denominator);
				case '<=':
				case '<<=':
					return FuzzyBoolean.toFuzzyBoolean(l.numerator <= right * l.denominator);
				case '>':
				case '>>':
					return FuzzyBoolean.toFuzzyBoolean(l.numerator > right * l.denominator);
				case '>=':
				case '>=':
					return FuzzyBoolean.toFuzzyBoolean(l.numerator >= right * l.denominator);
					
				case '+':
					return new Fraction(l.numerator + right*l.denominator, l.denominator, l.mixed).simplify();
				case '-':
					return new Fraction(l.numerator - right*l.denominator, l.denominator, l.mixed).simplify();
				case '*':
					return new Fraction(l.numerator * right, l.denominator, l.mixed).simplify();
				case '/':
					return new Fraction(l.numerator, l.denominator*right, l.mixed).simplify();
					
				case '^': 
					return Math.pow(this.toNumber(), right);

				default:
					return JelType.op(ctx, operator, this.toNumber(), right);
			}
		}
		else if (right instanceof Fraction) {
			const l = this.simplify();
			const r = right.simplify();
			if (!((l instanceof Fraction) && (r instanceof Fraction))) {
				if (operator == '/' && typeof l == 'number' && typeof r == 'number')
					return new Fraction(l, r, this.mixed).simplify();
				else 
					return JelType.op(ctx, operator, l, r);
			}
			
			switch (operator) {
				case '==':
				case '===':
					return FuzzyBoolean.toFuzzyBoolean(l.numerator === r.numerator && l.denominator === r.denominator);
				case '!=':
				case '!==':
					return FuzzyBoolean.toFuzzyBoolean(l.numerator !== r.numerator || l.denominator !== r.denominator);
					
				case '<':
				case '<<':
					return FuzzyBoolean.toFuzzyBoolean(l.numerator*r.denominator < r.numerator*l.denominator);
				case '<=':
				case '<<=':
					return FuzzyBoolean.toFuzzyBoolean(l.numerator*r.denominator <= r.numerator*l.denominator);
				case '>':
				case '>>':
					return FuzzyBoolean.toFuzzyBoolean(l.numerator*r.denominator > r.numerator*l.denominator);
				case '>=':
				case '>>=':
					return FuzzyBoolean.toFuzzyBoolean(l.numerator*r.denominator >= r.numerator*l.denominator);

				case '+':
					return new Fraction((l.numerator*r.denominator)+(r.numerator*l.denominator), l.denominator*r.denominator, l.mixed).simplify();
				case '-':
					return new Fraction((l.numerator*r.denominator)-(r.numerator*l.denominator), l.denominator*r.denominator, l.mixed).simplify();
				case '*':
					return new Fraction(l.numerator*r.numerator, l.denominator*r.denominator, l.mixed).simplify();
				case '/':
					return new Fraction(l.numerator*r.denominator, l.denominator*r.numerator, l.mixed).simplify();

				default:
					return JelType.op(ctx, operator, this.toNumber(), right.toNumber());
			}
		}
		return super.op(ctx, operator, right);
	}

	opReversed(ctx: Context, operator: string, left: any): any {	
		if (typeof left == 'number') {
			if (!Number.isInteger(left))
				return JelType.op(ctx, operator, left, this.toNumber());
			switch (operator) {
				case '+':
					return new Fraction(left*this.denominator+this.numerator, this.denominator, this.mixed).simplify();
				case '-':
					return new Fraction(left*this.denominator-this.numerator, this.denominator, this.mixed).simplify();
				case '*':
					return new Fraction(left*this.numerator, this.denominator, this.mixed).simplify();
				case '/':
					return new Fraction(left*this.denominator, this.numerator, this.mixed).simplify();
				case '^':
					return Math.pow(left, this.toNumber());
			}
		}
		return super.op(ctx, operator, left);
	}

	singleOp(ctx: Context, operator: string): any {
		switch (operator) {
			case '!':
				return FuzzyBoolean.toFuzzyBoolean(!this.numerator);
			case '-':
				return new Fraction(-this.numerator, this.denominator, this.mixed);
			case '+':
				return this;
			case 'abs':
				return this.numerator >= 0 ? this : new Fraction(Math.abs(this.numerator), this.denominator, this.mixed);
		}
		return super.singleOp(ctx, operator);
	}
	
	toNumber_jel_mapping: Object;
	toNumber(): number {
		return this.denominator !== 0 ? (this.numerator / this.denominator) : NaN;
	}
	
	toBoolean(): FuzzyBoolean {
		return FuzzyBoolean.toFuzzyBoolean(!!this.numerator);
	}
	
	simplify_jel_mapping: Object;
	simplify(): Fraction | number {
		const n = Fraction.gcd(this.numerator, this.denominator);
		if (n == 1)
			return this;
		else if (n == this.denominator)
			return this.numerator / this.denominator;
		else
			return new Fraction(this.numerator / n, this.denominator / n, this.mixed); 
	}
	
	getSerializationProperties(): any[] {
		return [this.numerator, this.denominator, this.mixed];
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
	
	static create_jel_mapping = {numerator:1, denominator: 2, mixed: 3};
	static create(ctx: Context, ...args: any[]): any {
		return new Fraction(args[0], args[1], args[2]);
	}
}

Fraction.prototype.reverseOps = {'-': true, '/': true};
Fraction.prototype.toNumber_jel_mapping = {};
Fraction.prototype.simplify_jel_mapping = {};

