import JelType from '../JelType';
import Serializer from '../Serializer';
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
					case '==': 
					case '===':
					case '!=': 
					case '!==':
					case '>>':
					case '<<':
					case '<<=':
					case '>>=':
					case '>':
					case '<':
					case '<=':
					case '>=':
						return Util.resolveValueAndError(this.convertTo(ctx, right.unit), converted => JelType.op(ctx, operator, converted, right), ()=>FuzzyBoolean.toFuzzyBoolean(operator == '!=' || operator == '!=='));
					case '+':
					case '-':
						return Util.resolveValueAndError(this.convertTo(ctx, right.unit), converted => JelType.op(ctx, operator, converted, right), ()=>Promise.reject(new Error(`Can not apply`)));
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
				return Promise.reject(new Error(`UnitValues can only convert to simple Unit types, but not to complex unit ${target.toString()}.`));
			return this.convertTo(ctx, target.toSimpleType(ctx).distinctName);
		}
		else if (typeof target != 'string')
			return this.convertTo(ctx, target.distinctName);

		if (this.unit.isSimple().toRealBoolean()) 
			return this.convertSimpleTo(ctx, target as string, false);
		else
			return this.convertComplexTo(ctx, target as string);
	}
	
	private convertSimpleTo(ctx: Context, target: string, mustBePrimaryUnit: boolean): Promise<UnitValue> | UnitValue {
		const simpleUnit: IDbRef = this.unit.toSimpleType(ctx);
		return simpleUnit.withMember(ctx, 'convertsTo', (conversionDict: any) => {
			if (!(conversionDict instanceof Dictionary))
					return Promise.reject(new Error("Can not convert "+simpleUnit.distinctName+" to any other units. No convertsTo property defined."));

			const conversionObj: Dictionary = conversionDict.elements.get(target);
			if (conversionObj != null) {
				const f: any = conversionObj.elements.get('f');
				if (f) {
					if (!(f instanceof Callable))
						return Promise.reject(new Error(`Broken configuration in ${simpleUnit.distinctName}.convertsTo.${target}: should be Callable, but is ${Serializer.serialize(f)}.`));
					return Util.resolveValue(f.invoke(ctx, this.value), v=>new UnitValue(v, target));
				}
				const factor: number | Fraction = conversionObj.elements.get('factor');
				if (factor)
					return Util.resolveValue(JelType.op(ctx, '*', factor, this.value), v=>new UnitValue(v, target));
				else
					return Promise.reject(new Error("Can not convert from "+simpleUnit.distinctName+" to type " + target+": neither factor not function set."));
			}
			else 
				return simpleUnit.withMember(ctx, 'isPrimaryUnit', (isPrimaryUnit: any)=> {
					if (JelType.toRealBoolean(isPrimaryUnit))
						return Promise.reject(new Error(`Can not convert from unit ${this.unit.toString()} to unit ${target}. No conversion rule available.`));

					return simpleUnit.withMember(ctx, 'quantityCategory', (qc: any)=> {
						if (!(qc && qc.isIDBEntry))
							return Promise.reject(new Error(`Unit ${simpleUnit.distinctName} is missing required property quantityCategory.`));

						return qc.withMember(ctx, 'primaryUnit', (primaryUnit: any) => {
							if (!(primaryUnit && primaryUnit.isIDBEntry))
								return Promise.reject(new Error(`Unit ${simpleUnit.distinctName} is missing required property primaryUnit.`));

							return primaryUnit.withMember(ctx, 'isPrimaryUnit', (isPrimaryUnit: any) => {
								if (!JelType.toRealBoolean(isPrimaryUnit))
									return Promise.reject(new Error(`Unit ${qc.distinctName} defines ${primaryUnit.distinctName} as primary unit, but isPrimaryUnit is not set to true.`));
								return Util.resolveValue(this.convertSimpleTo(ctx, primaryUnit.distinctName, true), p=>p.convertSimpleTo(ctx, target, false));
							});
						});
					});
				});
		});
	}

	private static tryComplexConversion(uv: UnitValue, target: string, targetUnits: Unit[]): UnitValue | undefined {
			for (let u of targetUnits)
				if (uv.unit.equals(u))
					return new UnitValue(uv.value, new Unit(target));
	}
	
	private convertComplexTo(ctx: Context, target: string): Promise<UnitValue> | UnitValue {
		return ctx.getSession().with(target, (targetEntry: IDbEntry) =>{
			return targetEntry.withMember(ctx, 'createFrom', (compatTypes: any) => {
				// attempt 1: direct conversion
				if (compatTypes instanceof List && compatTypes.elements.length) {
					const a1 = UnitValue.tryComplexConversion(this, target, compatTypes.elements);
					if (a1)
						return a1;
				}

				return Util.resolveValue(this.toPrimaryUnits(ctx), (primeUV: UnitValue) =>{
					// attempt 2: convert this to primary units, and then try to convert to target
					if (compatTypes instanceof List && compatTypes.elements.length) {
						const a2 = UnitValue.tryComplexConversion(primeUV, target, compatTypes.elements);
						if (a2)
							return a2;
					}

					// attempt 3: try to convert primary units to target type's primary unit, and then convert to target
					return targetEntry.withMember(ctx, 'quantityCategory', (qCategory: any)=> {
						if (!(qCategory && qCategory.isIDBEntry))
							return Promise.reject(new Error(`Category ${targetEntry.distinctName} does not have required property 'quantityCategory'.`));
						
						return qCategory.withMember(ctx, 'primaryUnit', (primaryUnit: any) => {
							if (!(primaryUnit && primaryUnit.isIDBEntry))
								return Promise.reject(new Error(`Category ${qCategory.distinctName} does not have required property 'primaryUnit'.`));

							if (primaryUnit.distinctName == target)
								return Promise.reject(new Error(`UnitValue with unit ${this.unit.toString()} is not compatible with target type ${target}. ${target} is a primary unit, but has no compatible conversion rules.`));

							return primaryUnit.withMember(ctx, 'createFrom', (pCompatTypes: any) => {
								if (!(pCompatTypes instanceof List) || !pCompatTypes.elements.length)
									return Promise.reject(new Error(`UnitValue with unit ${this.unit.toString()} is not compatible with target type ${target}. Primary unit ${primaryUnit.distinctName} has no conversion rules.`));
								const p1 = UnitValue.tryComplexConversion(primeUV, primaryUnit.distinctName, pCompatTypes.elements);
								if (p1)
									return p1.convertTo(ctx, target);
								else
									return Promise.reject(new Error(`UnitValue with unit ${this.unit.toString()} is not compatible with target type ${target}. No way to convert ${primeUV.unit.toString()} to ${primaryUnit.distinctName}.`));
							});
						});
					});

				});
			});
		});
	}
	

	// Converts all sub-units in Unit to the primary units (e.g. inch->meter, hp->watt)
	toPrimaryUnits_jel_mapping: Object;
	toPrimaryUnits(ctx: Context): UnitValue | Promise<UnitValue> {
		let uv: UnitValue = this;
		const session = ctx.getSession();
		const unitRefs: IDbRef[] = Array.from(this.unit.units.keys()).map(r=>session.createDbRef(r));
		
		return Util.resolveArray(unitRefs.map(u=>u.member(ctx, 'isPrimaryUnit')), (unitEntryFilter: any[]) => {
			const nonPrimaryUnits: IDbRef[] = unitRefs.filter((u, i)=>!JelType.toRealBoolean(unitEntryFilter[i]));
			if (!nonPrimaryUnits.length)
				return this;

			return Util.resolveArray(nonPrimaryUnits.map(u=>u.member(ctx, 'quantityCategory')), (catRefs: IDbRef[])=>{
				return Util.resolveArray(nonPrimaryUnits.map((oldUnit: IDbRef, i: number)=> {
					const catRef: IDbRef = catRefs[i];

					return Util.resolveValue(catRef.member(ctx, 'primaryUnit'), (primaryUnit: any) => {
						if (!primaryUnit || !primaryUnit.isIDBRef)
							throw new Error(`Invalid Category @${catRef.distinctName}, missing property primaryUnit. Got ${Serializer.serialize(primaryUnit)}`);

						return Util.resolveValue(oldUnit.member(ctx, 'convertsTo'), (convertsTo: any) => {
							if (convertsTo && (convertsTo instanceof Dictionary) && convertsTo.elements.has(primaryUnit.distinctName)) {
								const t = convertsTo.elements.get(primaryUnit.distinctName);
								if (!(t instanceof Dictionary))
									throw new Error(`@${oldUnit.distinctName}.convertsTo.${primaryUnit.distinctName} must be a Dictionary, but has a different type.`);
								const newUnitMap = new Dictionary(uv.unit.units);
								const exp = newUnitMap.elements.get(oldUnit.distinctName);
								newUnitMap.elements.delete(oldUnit.distinctName);
								newUnitMap.elements.set(primaryUnit.distinctName, (newUnitMap.elements.get(primaryUnit.distinctName) || 0) + exp);
								if (t.elements.has('factor'))
									uv = new UnitValue(JelType.op(ctx, '*', uv.value, JelType.op(ctx, '^', t.elements.get('factor'), exp)), new Unit(newUnitMap));
								else if (t.elements.has('f') && exp == 1) {
									uv = new UnitValue(t.elements.get('f').invoke(ctx, uv.value), new Unit(newUnitMap));
								}
							}
						});
					});
				}), ()=>uv);
			});
		});
	}
	
	private trySimplification(ctx: Context, uv: UnitValue): UnitValue | Promise<UnitValue|undefined> |  undefined {
		const unitNames: string[] = Array.from(uv.unit.units.keys());
		return Util.resolveArray(unitNames.map(distinctName=>Util.resolveValue(ctx.getSession().getMember(distinctName, 'usedBy'), 
																																					 usedBy=>({distinctName, usedBy}))), 
			(unitEntries: any[])=>{
			const possibleUnits: string[] = Util.collect(unitEntries, e=> {
				const usedBy: any = e.usedBy;
				if (usedBy instanceof List)
					return usedBy.elements.map(e=>e.distinctName);
				else if (usedBy)
					throw new Error(`Broken usedBy property in ${e.distinctName}, should be List.`);
			});
			
			return Util.resolveArray(Array.from(new Set(possibleUnits)).map(possibleUnit=>Util.resolveValue(ctx.getSession().getMember(possibleUnit, 'createFrom'), 
																																																			createFrom=>({createFrom, distinctName: possibleUnit}))), 
				(unitEntries: any[])=>{
				for (let u of unitEntries) {
					if (u.createFrom instanceof List)
						for (let conv of u.createFrom.elements) {
							if (conv.equals(uv.unit))
								return new UnitValue(uv.value, new Unit(u.distinctName));
						}
					else if (u.createFrom)
						return Promise.reject(new Error(`Broken createFrom property in ${u.distinctName}, should be List. Value: \n${u.createFrom}`));
				}
			});
		});
	}
	
	// attempts to simplify the UnitValue to the simplest possible type
	simplify_jel_mapping: Object;
	simplify(ctx: Context): UnitValue | Promise<UnitValue> {
		if (this.unit.isSimple().toRealBoolean())
			return this;
		return Util.resolveValue(this.trySimplification(ctx, this), t1=>t1 || Util.resolveValue(Util.resolveValue(this.toPrimaryUnits(ctx), t3=>this.trySimplification(ctx, t3)), t2=>t2 || this));
	}
	
	round_jel_mapping: Object;
	round(ctx: Context, precision: number = 1): UnitValue {
		return new UnitValue(Math.round(JelType.toNumber(this.value)*precision)/precision, this.unit);
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
UnitValue.prototype.round_jel_mapping = {};
UnitValue.prototype.simplify_jel_mapping = {};
UnitValue.prototype.toPrimaryUnits_jel_mapping = {};
UnitValue.prototype.JEL_PROPERTIES = {value:1, unit:1};

