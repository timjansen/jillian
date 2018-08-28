import JelType from '../JelType';
import Context from '../Context';
import Callable from '../Callable';
import {IDbRef} from '../IDatabase';
import Unit from './Unit';
import FuzzyBoolean from './FuzzyBoolean';
import Dictionary from './Dictionary';
import Fraction from './Fraction';
import ApproximateNumber from './ApproximateNumber';
import Util from '../../util/Util';


/**
 * Represents a value with unit and accuracy.
 */
export default class UnitValue extends JelType {
	JEL_PROPERTIES: Object;
	
	public value: number | Fraction | ApproximateNumber;
	public unit: Unit;
	
	constructor(value: number | Fraction | ApproximateNumber, unit: IDbRef | Unit) {
		super();
		this.value = value;
		this.unit = unit instanceof Unit ? unit : new Unit(unit);
	}

	op(ctx: Context, operator: string, right: any): any {
		if (right instanceof UnitValue) {
			if (this.unit.equals(right.unit)) {
				switch (operator) {
				case '==': 
				case '===':
				case '>>':
				case '<<':
				case '<<=':
				case '>>=':
				case '!=':
				case '!==':
				case '>':
				case '<':
				case '<=':
				case '>=':
						return JelType.op(ctx, operator, this.value, right.value);
				case '+':
				case '-':
						return new UnitValue(JelType.op(ctx, operator, this.value, right.value), this.unit);
				case '/':
						return JelType.op(ctx, operator, this.value, right.value);
				}
			}
			else {
				function defaultOp() {
					return new UnitValue(JelType.op(ctx, operator, this.value, right.value), JelType.op(ctx, operator, this.unit, right.unit));
				}
				
				const leftConverted = this.convertTo(ctx, right.unit);
				if (leftConverted) 
					return JelType.op(ctx, operator, leftConverted, right);
				else if (this.unit.isSimple().toRealBoolean() && right.unit.isSimple().toRealBoolean()) {
					const rightUnit = right.unit.getSimpleType(ctx).distinctName;
					switch (operator) {
					case '*':
							return this.unit.getSimpleType(ctx).with(ctx, 
																				st=>st.member(ctx, 'multipliesTo').has(rightUnit).toRealBoolean() ? st.member(ctx, 'multipliesTo').get(rightUnit).f(this) : defaultOp());
					case '/':
							return this.unit.getSimpleType(ctx).with(ctx, 
																				st=>st.member(ctx, 'dividesTo').has(rightUnit).toRealBoolean() ? st.member(ctx, 'dividesTo').get(rightUnit).f(this) : defaultOp());
					}
				}
				else
					switch (operator) {
					case '*':
					case '/':
							return defaultOp();
					}
			}
		}
		else if (typeof right == 'number' || right instanceof Fraction || right instanceof ApproximateNumber) {
				switch (operator) {
				case '*':
				case '/':
					return new UnitValue(JelType.op(ctx, operator, this.value, right), this.unit);
				}		
		}
		return super.op(ctx, operator, right);
	}
	
	singleOp(ctx: Context, operator: string): any {
		if (operator == '!') 
			return JelType.singleOp(ctx, operator, this.value);
		if (operator == 'abs')
			return new UnitValue(JelType.singleOp(ctx, operator, this.value), this.unit);
		return super.singleOp(ctx, operator);
	}

	opReversed(ctx: Context, operator: string, left: any): any {
		if (typeof left == 'number' || left instanceof Fraction || left instanceof ApproximateNumber) {
			switch (operator) {
				case '*':
				case '/':
					return new UnitValue(JelType.op(ctx, operator, left, this.value), this.unit);
				}		
		}
		return super.opReversed(ctx, operator, left);
	}
	
	// returns the UnitValue converted to the given value, or returns rejected Promise if conversion not possible
	convertTo_jel_mapping: Object;
	convertTo(ctx: Context, target: Unit|IDbRef|string): Promise<UnitValue> | UnitValue {
		if (!this.unit.isSimple().toRealBoolean())
			return Promise.reject(new Error('UnitValue can only convert simple Unit types.'));
		if (target instanceof Unit) {
			if (!target.isSimple().toRealBoolean())
				return Promise.reject(new Error('UnitValue can only convert to simple Unit types.'));
			return this.convertTo(ctx, target.getSimpleType(ctx).distinctName);
		}
		else if (typeof target != 'string')
			return this.convertTo(ctx, target.distinctName);
		
		return this.unit.getSimpleType(ctx).with(ctx, (tu: any) => {
			const conversionF: Callable = tu.member(ctx, 'convertsTo').get(target);
			if (conversionF != null)
				return Util.resolveValue(v=>new Unit(v, target), conversionF.invokeWithContext(ctx, this.value));
			else
				return Promise.reject(new Error("Can not convert to unsupported type " + target));
		}); 
	}
	
	toNumber_jel_mapping: Object;
	toNumber(): number {
		return JelType.toNumber(this.value);
	}
	
	toBoolean(): FuzzyBoolean {
		return FuzzyBoolean.toFuzzyBoolean(!!this.toNumber());
	}
	
	getSerializationProperties(): any[] {
		return [this.value, this.unit];
	}
	
	static create_jel_mapping = {value: 0, unit: 1};
	static create(...args: any[]): UnitValue {
		return new UnitValue(args[0], args[1]);
	}
}

UnitValue.prototype.reverseOps = {'-':1, '/': 1};
UnitValue.prototype.toNumber_jel_mapping = {};
UnitValue.prototype.convertTo_jel_mapping = {'>ctx': true, type: 1};
UnitValue.prototype.JEL_PROPERTIES = {value:1, unit:1};

