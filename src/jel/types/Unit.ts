import Runtime from '../Runtime';
import JelObject from '../JelObject';
import Context from '../Context';
import {IDbRef} from '../IDatabase';
import FuzzyBoolean from './FuzzyBoolean';
import Fraction from './Fraction';
import ApproximateNumber from './ApproximateNumber';
import JelString from './JelString';
import JelNumber from './JelNumber';
import List from './List';
import Dictionary from './Dictionary';

function mergeUnitMaps(a: Map<string, number>, b?: Map<string, number>): Map<string, number> {
	const r = new Map<string, number>();
	a.forEach((v, k)=>r.set(k, (r.get(k) || 0) + v));
	if (b)
		b.forEach((v, k)=> {
			const e = r.get(k);
			if (e == null)
				r.set(k, v);
			else if (e == -v)
				r.delete(k);
			else
				r.set(k, e + v);
		});
	return r;
}

function invertUnitMap(a: Map<string, number>): Map<string, number> {
	const r = new Map<string, number>();
	a.forEach((v, k)=>r.set(k, -v));
	return r;
}

function multiplyUnitMap(factor: number, a: Map<string, number>): Map<string, number> {
	const r = new Map<string, number>();
	a.forEach((v, k)=>r.set(k, factor*v));
	return r;
}



/**
 * Represents a unit. Supports complex units, like '1/s' or 'm*m*m/kw'.
 */
export default class Unit extends JelObject {
	JEL_PROPERTIES: Object;
	
	public units = new Map<string,number>();    // distinctName->exponent
	private simple: boolean;

	constructor(numeratorUnits: List | IDbRef | JelString | string | Dictionary | Map<string,number>, denominatorUnits?: List | IDbRef | string | JelString) {
		super();
		if (numeratorUnits instanceof Map) {
			this.units = numeratorUnits;
			this.simple = this.units.size == 1 && this.units.values().next().value == 1  && !denominatorUnits;
		}
		else if (numeratorUnits instanceof List) {
			numeratorUnits.elements.forEach(n=>this.units.set(n.distinctName, (this.units.get(n.distinctName) || 0) + 1));
			this.simple = numeratorUnits.elements.length == 1 && !denominatorUnits;
		}
		else if (numeratorUnits instanceof Dictionary) {
			const newMap = new Map<string, number>();
			numeratorUnits.jsEach((k, v)=>newMap.set(k.value, v.value));
			this.units = newMap;
			this.simple = this.units.size == 1 && newMap.values().next().value == 1  && !denominatorUnits;
		}
		else if (numeratorUnits instanceof JelString) {
			this.units.set(numeratorUnits.value, 1);
			this.simple = !denominatorUnits;
		}
		else {
			this.units.set((numeratorUnits as IDbRef).distinctName, 1);
			this.simple = !denominatorUnits;
		}
		
		if (denominatorUnits instanceof List)
			denominatorUnits.elements.forEach(n=>this.units.set(n.distinctName, (this.units.get(n.distinctName) || 0) - 1));
		else if (denominatorUnits instanceof JelString)
			this.units.set(denominatorUnits.value, -1);
		else if (denominatorUnits)
			this.units.set((denominatorUnits as IDbRef).distinctName, -1);
	}

	op(ctx: Context, operator: string, right: JelObject): JelObject|Promise<JelObject> {
		if (right instanceof Unit) {
			switch (operator) {
			case '==': 
			case '===':
					return FuzzyBoolean.valueOf(this.equals(right));
			case '!=':
			case '!==':
					return FuzzyBoolean.valueOf(!this.equals(right));
			case '*':
					return new Unit(mergeUnitMaps(this.units, right.units));
			case '/':
					return new Unit(mergeUnitMaps(this.units, invertUnitMap(right.units)));
			}
		}
		else if (right instanceof JelNumber || right instanceof Fraction || right instanceof ApproximateNumber) { 
			switch (operator) {
			case '^':
				return new Unit(multiplyUnitMap(JelNumber.toRealNumber(right), this.units));
			case '*':
			case '/':
				return this;
			}
		}
		return super.op(ctx, operator, right);
	}

	equals(right: Unit): boolean {
		if (this.units.size != right.units.size)
			return false;
		for (let key of this.units.keys())
			if (this.units.get(key) != right.units.get(key))
				return false;
		return true;
	}
	
	isSimple_jel_mapping: Object;
	isSimple(): boolean {
		return this.simple;
	}
	
	toSimpleType_jel_mapping: Object;
	toSimpleType(ctx: Context): IDbRef {
		if (!this.simple)
			throw new Error(`UnitValue.toSimpleType() can only be called on simple types, not on complex unit ${this.toString()}.`);
		return ctx.getSession().createDbRef(this.units.keys().next().value);
	}

	isType_jel_mapping: Object;
	isType(ctx: Context, unit: IDbRef | string): boolean {
		if (!this.simple)
			return false;
		return this.toSimpleType(ctx).distinctName == (typeof unit == 'string' ? unit : unit.distinctName);
	}
	
	getSerializationProperties(): any[] {
		return [new Dictionary(this.units, true)];
	}
	
	toString(): string {
		return Array.from(this.units.entries()).map((r: any) =>r[1] != 1 ? `${r[0]}^${r[1]}` : r[0]).join('*');
	}
	
	static create_jel_mapping = {numeratorUnits: 1, denominatorUnits: 2, units: 1};
	static create(ctx: Context, ...args: any[]): Unit {
		return new Unit(args[0], args[1]);
	}
}

Unit.prototype.isSimple_jel_mapping = {};
Unit.prototype.toSimpleType_jel_mapping = {};
Unit.prototype.isType_jel_mapping = {unit: 1};


