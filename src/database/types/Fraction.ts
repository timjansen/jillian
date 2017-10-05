import JelType from '../../jel/JelType';
import Range from './Range';

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
		else {
			this.numerator = numerator; 
			this.denominator = denominator; 
		}
	}
	
	op(operator: string, right: any): any {
		if (right == null)
			return null;
		else if (typeof right == 'number') {
			if (!Number.isInteger(right))
				return JelType.op(operator, this.toNumber(), right);

			const l = this.simplify();
			switch (operator) {
				case '==':
				case '===':
					return l.numerator === right * l.denominator;
				case '!=':
				case '!==':
					return l.numerator !== right * l.denominator;
					
				case '<':
				case '<<':
					return l.numerator < right * l.denominator;
				case '<=':
				case '<<=':
					return l.numerator <= right * l.denominator;
				case '>':
				case '>>':
					return l.numerator > right * l.denominator;
				case '>=':
				case '>=':
					return l.numerator >= right * l.denominator;
					
				case '+':
					return new Fraction(l.numerator + right*l.denominator, l.denominator, l.mixed).simplify();
				case '-':
					return new Fraction(l.numerator - right*l.denominator, l.denominator, l.mixed).simplify();
				case '*':
					return new Fraction(l.numerator * right, l.denominator, l.mixed).simplify();
				case '/':
					return new Fraction(l.numerator, l.denominator*right, l.mixed).simplify();
				default:
					return JelType.op(operator, this.toNumber(), right);
			}
		}
		else if (right instanceof Fraction) {
			const l = this.simplify();
			const r = right.simplify();
			switch (operator) {
				case '==':
				case '===':
					return l.numerator === r.numerator && l.denominator === r.denominator;
				case '!=':
				case '!==':
					return l.numerator !== r.numerator || l.denominator !== r.denominator;
					
				case '<':
				case '<<':
					return l.numerator*r.denominator < r.numerator*l.denominator;
				case '<=':
				case '<<=':
					return l.numerator*r.denominator <= r.numerator*l.denominator;
				case '>':
				case '>>':
					return l.numerator*r.denominator > r.numerator*l.denominator;
				case '>=':
				case '>>=':
					return l.numerator*r.denominator >= r.numerator*l.denominator;

				case '+':
					return new Fraction((l.numerator*r.denominator)+(r.numerator*l.denominator), l.denominator*r.denominator, l.mixed).simplify();
				case '-':
					return new Fraction((l.numerator*r.denominator)-(r.numerator*l.denominator), l.denominator*r.denominator, l.mixed).simplify();
				case '*':
					return new Fraction(l.numerator*r.numerator, l.denominator*r.denominator, l.mixed).simplify();
				case '/':
					return new Fraction(l.numerator*r.denominator, l.denominator*r.numerator, l.mixed).simplify();
			}
		}
		super.op(operator, right);
	}

	opReversed(operator: string, left: any): any {	
		if (typeof left == 'number') {
			if (!Number.isInteger(left))
				return JelType.op(operator, left, this.toNumber());
			switch (operator) {
				case '-':
					return new Fraction(left*this.denominator-this.numerator, this.denominator, this.mixed).simplify();
				case '/':
					return new Fraction(left*this.denominator, this.numerator, this.mixed).simplify();
			}
		}
		super.op(operator, left);
	}

	singleOp(operator: string): any {
		switch (operator) {
			case '!':
				return !this.numerator;
			case '-':
				return new Fraction(-this.numerator, this.denominator, this.mixed);
			case '+':
				return this;
		}
		super.singleOp(operator);
	}
	
	toNumber_jel_mapping: Object;
	toNumber(): number {
		return this.denominator !== 0 ? (this.numerator / this.denominator) : NaN;
	}
	
	simplify_jel_mapping: Object;
	simplify(): Fraction {
		const n = Fraction.gcd(this.numerator, this.denominator);
		if (n == 1)
			return this;
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
	
	static create_jel_mapping = {numerator:0, denominator: 1, mixed: 2};
	static create(...args: any[]): any {
		return new Fraction(args[0], args[1], args[2]);
	}
}

Fraction.prototype.reverseOps = {'-': true, '/': true};
Fraction.prototype.toNumber_jel_mapping = {min:0, max:1};
Fraction.prototype.simplify_jel_mapping = {};

