import JelType from '../JelType';
import Context from '../Context';
import Callable from '../Callable';
import {IDbRef, IDbEntry} from '../IDatabase';
import Unit from './Unit';
import FuzzyBoolean from './FuzzyBoolean';
import Dictionary from './Dictionary';
import List from './List';
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
	
	constructor(value: number | Fraction | ApproximateNumber, unit: IDbRef | Unit | string) {
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
				case '*':
						return new UnitValue(JelType.op(ctx, operator, this.value, right.value), JelType.op(ctx, operator, this.unit, right.unit)).simplify(ctx);
				}
			}
			else {
				switch (operator) {
					case '*':
					case '/':
						return new UnitValue(JelType.op(ctx, operator, this.value, right.value), JelType.op(ctx, operator, this.unit, right.unit)).simplify(ctx);
				}
			}
		}
		else if (typeof right == 'number' || right instanceof Fraction || right instanceof ApproximateNumber) {
				switch (operator) {
				case '*':
				case '/':
				case '^':
					return new UnitValue(JelType.op(ctx, operator, this.value, right), JelType.op(ctx, operator, this.unit, right)).simplify(ctx);
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
		if (target instanceof Unit) {
			if (!target.isSimple().toRealBoolean())
				return Promise.reject(new Error('UnitValue can only convert to simple Unit types.'));
			return this.convertTo(ctx, target.toSimpleType(ctx).distinctName);
		}
		else if (typeof target != 'string')
			return this.convertTo(ctx, target.distinctName);

		if (!this.unit.isSimple().toRealBoolean()) 
			return this.convertComplexTo(ctx, target as string);
		
		return this.unit.toSimpleType(ctx).with(ctx, (tu: any) => {
			const conversionObj: Map<string, any> = tu.member(ctx, 'convertsTo').get(target);
			if (conversionObj != null) {
				const f: Callable = conversionObj.get('f');
				if (f)
					return Util.resolveValue(v=>new Unit(v, target), f.invoke(ctx, this.value));
				const factor: number | Fraction = conversionObj.get('factor');
				if (factor)
					return Util.resolveValue(v=>new Unit(v, target), JelType.op(ctx, '*', factor, this.value));
				else
					return Promise.reject(new Error("Can not convert from "+tu.distinctName+" to type " + target+": neither factor not function set."));
			}
			else if (JelType.toRealBoolean(tu.member(ctx, 'isPrimaryUnit')))
				return Promise.reject(new Error("Can not convert to unsupported type " + target));
			else
				return tu.member(ctx, 'quantityCategory').with(ctx, (qc: any) => Util.resolveValue(p=>p.convertTo(ctx, target), this.convertTo(ctx, qc.member(ctx, 'primaryUnit'))));
		});
	}

	private static tryComplexConversion(uv: UnitValue, target: string, targetUnits: Unit[]): UnitValue | undefined {
			for (let u of targetUnits)
				if (uv.unit.equals(u))
					return new UnitValue(uv.value, new Unit(target));
	}
	
	private convertComplexTo(ctx: Context, target: string): Promise<UnitValue> | UnitValue {
		return ctx.getSession().with(target, targetEntry=>{
			const compatTypes: List | null = targetEntry.member(ctx, 'createFrom');
			if (!compatTypes || !compatTypes.elements.length)
				return Promise.reject(new Error(`Target type ${target} does not support complex conversions.`));

			// attempt 1: direct conversion
			const a1 = UnitValue.tryComplexConversion(this, target, compatTypes.elements);
			if (a1)
				return a1;

			return Util.resolveValue(primeUV=>{
				// attempt 2: conversion of the primary Unit to the target
				const a2 = UnitValue.tryComplexConversion(primeUV, target, compatTypes.elements);
				if (a2)
					return a2;
				
				// attempt 3: try to convert primary units to target type's primary unit, and then convert to target
				targetEntry.withMember(ctx, 'quantityCategory', (catEntry: IDbEntry)=> {
					const primaryUnit: IDbRef = catEntry.member(ctx, 'primaryUnit');
					if (primaryUnit.distinctName == target)
						return Promise.reject(new Error(`UnitValue is not compatible with target type ${target}.`));
					
					return primaryUnit.with(ctx, pu=>{
						const pCompatTypes: List | null = pu.member(ctx, 'createFrom');
						if (!pCompatTypes || !pCompatTypes.elements.length)
							return Promise.reject(new Error(`UnitValue is not compatible with target type ${target}.`));
						const p1 = UnitValue.tryComplexConversion(primeUV, primaryUnit.distinctName, pCompatTypes.elements);
						if (p1)
							return p1.convertTo(ctx, target);
						else
							return Promise.reject(new Error(`UnitValue is not compatible with target type ${target}.`));
					});
				});
				
			}, this.toPrimaryUnits(ctx));
		});
	}
	
	// Converts all sub-units in Unit to the primary units (e.g. inch->meter, hp->watt)
	toPrimaryUnits_jel_mapping: Object;
	toPrimaryUnits(ctx: Context): UnitValue | Promise<UnitValue> {
		let uv: UnitValue = this;
		const unitNames: string[] = Array.from(this.unit.units.keys());
		const categories: Map<string, IDbEntry> = new Map();
		
		return Util.resolveArray((unitEntries: IDbEntry[])=>{
			const nonPrimaryUnits: IDbEntry[] = unitEntries.filter(u=>!JelType.toRealBoolean(u.member(ctx, 'isPrimaryUnit')));
			const catNames: Set<string> = new Set(nonPrimaryUnits.map(u=>u.member(ctx, 'quantityCategory').distinctName));
			return Util.resolveArray((cats: IDbEntry[])=>{
				cats.forEach(u=>categories.set(u.distinctName, u));
				nonPrimaryUnits.forEach(u=> {
					const target: string = categories.get(u.member(ctx, 'quantityCategory'))!.member(ctx, 'primaryUnit');
					const convertsTo: Dictionary = u.member(ctx, 'convertsTo');
					if (convertsTo && convertsTo.elements.has(target)) {
						const t = convertsTo.elements.get(target);
						const newUnitMap = new Dictionary(uv.unit.units);
						const exp = newUnitMap.elements.get(u.distinctName);
						newUnitMap.elements.delete(u.distinctName);
						newUnitMap.elements.set(target, exp);
						if (t.has('factor'))
							uv = new UnitValue(JelType.op(ctx, '*', uv.value, JelType.op(ctx, '^', t.get('factor'), exp)), new Unit(newUnitMap));
						else if (t.has('f') && exp == 1) {
							uv = new UnitValue(t.get('f').invoke(ctx, uv.value), new Unit(newUnitMap));
						}
					}
				});
				return uv;
			}, Array.from(catNames).map(u=>ctx.getSession().get(u)));
		}, unitNames.map(u=>ctx.getSession().get(u)));
	}
	
	private trySimplification(ctx: Context, uv: UnitValue): UnitValue | Promise<UnitValue|undefined> |  undefined {
		const unitNames: string[] = Array.from(this.unit.units.keys());
		return Util.resolveArray((unitEntries: IDbEntry[])=>{
			const possibleUnits: Set<string> = new Set(Util.collect(unitEntries, e=> {
				const usedBy: List | null = e.member(ctx, 'usedBy');
				if (usedBy)
					return usedBy.elements.map(e=>e.distinctName);
			}));
			
			return Util.resolveArray((unitEntries: IDbEntry[])=>{
				for (let u of unitEntries) {
					const conversions: List | null = u.member(ctx, 'convertFrom');
					if (conversions)
						for (let conv of conversions.elements)
							if (conv.equals(uv.unit))
								return new UnitValue(uv.value, new Unit(u.distinctName));
				}
			}, Array.from(possibleUnits).map(u=>ctx.getSession().get(u)));
		}, unitNames.map(u=>ctx.getSession().get(u)));
	}
	
	// attempts to simplify the UnitValue to the simplest possible type
	simplify(ctx: Context): UnitValue | Promise<UnitValue> {
		if (this.unit.isSimple())
			return this;
		
		return Util.resolveValue(t1=>t1 || Util.resolveValue(t2=>t2 || this, Util.resolveValue(t3=>this.trySimplification(ctx, t3), this.toPrimaryUnits(ctx))), this.trySimplification(ctx, this));
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
	
	static create_jel_mapping = {value: 1, unit: 2};
	static create(ctx: Context, ...args: any[]): UnitValue {
		return new UnitValue(args[0], args[1]);
	}
}

UnitValue.prototype.reverseOps = {'-':1, '/': 1};
UnitValue.prototype.toNumber_jel_mapping = {};
UnitValue.prototype.convertTo_jel_mapping = {type: 1};
UnitValue.prototype.JEL_PROPERTIES = {value:1, unit:1};

