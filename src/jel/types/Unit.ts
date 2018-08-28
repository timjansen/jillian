import JelType from '../JelType';
import Context from '../Context';
import {IDbRef} from '../IDatabase';
import FuzzyBoolean from './FuzzyBoolean';

function mergeUnitMaps(a: Map<string, number>, b?: Map<string, number>): Map<string, number> {
	const r = new Map<string, number>();
	a.forEach((v, k)=>r.set(k, (r.get(k) || 0) + 1));
	if (b)
		b.forEach((v, k)=>r.set(k, (r.get(k) || 0) + 1));
	return r;
}

/**
 * Represents a unit. Supports complex units, like '1/s' or 'm*m*m/kw'.
 */
export default class Unit extends JelType {
	JEL_PROPERTIES: Object;
	
	public numeratorUnits = new Map<string,number>();    // distinctName->count
	public denominatorUnits = new Map<string,number>();

	constructor(numeratorUnits: IDbRef[] | IDbRef | string| Map<string,number>, denominatorUnits: IDbRef[] | IDbRef | string| Map<string,number> = []) {
		super();
		if (Array.isArray(numeratorUnits))
			numeratorUnits.forEach(n=>this.numeratorUnits.set(n.distinctName, (this.numeratorUnits.get(n.distinctName) || 0) + 1));
		else if (numeratorUnits instanceof Map)
			this.numeratorUnits = numeratorUnits as Map<string, number>;
		else if (typeof numeratorUnits == 'string')
			this.numeratorUnits.set(numeratorUnits, 1);
		else
			this.numeratorUnits.set((numeratorUnits as IDbRef).distinctName, 1);

		if (Array.isArray(denominatorUnits))
			denominatorUnits.forEach(n=>this.denominatorUnits.set(n.distinctName, (this.denominatorUnits.get(n.distinctName) || 0) + 1));
		else if (numeratorUnits instanceof Map)
			this.denominatorUnits = denominatorUnits as Map<string, number>;
		else if (typeof denominatorUnits == 'string')
			this.denominatorUnits.set(denominatorUnits, 1);
		else
			this.denominatorUnits.set((denominatorUnits as IDbRef).distinctName, 1);
	}

	op(ctx: Context, operator: string, right: any): any {
		if (right instanceof Unit) {
			switch (operator) {
			case '==': 
			case '===':
					return FuzzyBoolean.toFuzzyBoolean(this.equals(right));
			case '!=':
			case '!==':
					return FuzzyBoolean.toFuzzyBoolean(!this.equals(right));
			case '*':
					return new Unit(mergeUnitMaps(this.numeratorUnits, right.numeratorUnits), mergeUnitMaps(this.denominatorUnits, right.denominatorUnits));
			case '/':
					return new Unit(mergeUnitMaps(this.numeratorUnits, right.denominatorUnits), mergeUnitMaps(this.denominatorUnits, right.numeratorUnits));
			}
		}
		return super.op(ctx, operator, right);
	}

	equals(right: Unit): boolean {
		if (this.numeratorUnits.size != right.numeratorUnits.size ||
				this.denominatorUnits.size != right.denominatorUnits.size)
			return false;
		for (let key of this.numeratorUnits.keys())
			if (this.numeratorUnits.get(key) != right.numeratorUnits.get(key))
				return false;
		for (let key of this.denominatorUnits.keys())
			if (this.denominatorUnits.get(key) != right.denominatorUnits.get(key))
				return false;
		return true;
	}
	
	isSimple_jel_mapping: Object;
	isSimple(): FuzzyBoolean {
		return FuzzyBoolean.toFuzzyBoolean(this.numeratorUnits.size == 1 && !this.denominatorUnits.size);
	}
	
	getSimpleType_jel_mapping: Object;
	getSimpleType(ctx: Context): IDbRef {
		if (!this.isSimple().toRealBoolean())
			throw new Error("UnitValue.getSimpleType() can only be called on simple types");
		return ctx.dbSession.createDbRef(this.numeratorUnits.keys().next());
	}

	isType_jel_mapping: Object;
	isType(ctx: Context, unit: IDbRef | string): FuzzyBoolean {
		if (!this.isSimple().toRealBoolean())
			return FuzzyBoolean.FALSE;
		return FuzzyBoolean.toFuzzyBoolean(this.getSimpleType(ctx).distinctName == (typeof unit == 'string' ? unit : unit.distinctName));
	}
	
	
	getSerializationProperties(): any[] {
		return [this.numeratorUnits, this.denominatorUnits];
	}
	
	static create_jel_mapping = {value: 1, unit: 2};
	static create(ctx: Context, ...args: any[]): Unit {
		return new Unit(args[0], args[1]);
	}
}

Unit.prototype.isSimple_jel_mapping = {};
Unit.prototype.getSimpleType_jel_mapping = {};


