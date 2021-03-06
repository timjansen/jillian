import JelObject from '../JelObject';
import Runtime from '../Runtime';
import Serializer from '../Serializer';
import Context from '../Context';
import Callable from '../Callable';
import {IDbRef} from '../IDatabase';
import Unit from './Unit';
import NamedObject from './NamedObject';
import JelBoolean from './JelBoolean';
import JelString from './JelString';
import NativeJelObject from './NativeJelObject';
import Class from './Class';
import Float from './Float';
import Numeric from './Numeric';
import Dictionary from './Dictionary';
import List from './List';
import Fraction from './Fraction';
import ApproximateNumber from './ApproximateNumber';
import Util from '../../util/Util';
import TypeChecker from './TypeChecker';
import BaseTypeRegistry from '../BaseTypeRegistry';


const VALUE_TYPES = ['Float', 'Fraction', 'ApproximateNumber'];
const UNIT_TYPES = ['Unit', 'String'];

/**
 * Represents a value with unit.
 */
export default class UnitValue extends NativeJelObject implements Numeric {
  public value_jel_property: boolean;
  public unit_jel_property: boolean;
	public unit: Unit;
  static clazz: Class|undefined;

  constructor(public value: Float | Fraction | ApproximateNumber, unit: IDbRef | Unit | string | JelString) {
		super('UnitValue');
		this.value = value;
		this.unit = unit instanceof Unit ? unit : new Unit(unit);
	}
  
  get clazz(): Class {
    return UnitValue.clazz!;
  }

	op(ctx: Context, operator: string, right: JelObject, isReversal: boolean = false): JelObject|Promise<JelObject> {
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
						return Runtime.op(ctx, operator, this.value, right.value);
				case '+':
				case '-':
						return new UnitValue(Runtime.op(ctx, operator, this.value, right.value) as any, this.unit);
				case '/':
						return Runtime.op(ctx, operator, this.value, right.value);
				case '*':
						return new UnitValue(Runtime.op(ctx, operator, this.value, right.value) as any, Runtime.op(ctx, operator, this.unit, right.unit) as any).simplify(ctx);
				case '+-':
					return this.toApproxNumber(right.value instanceof ApproximateNumber ? Runtime.op(ctx, '+', right.value.value, right.value.maxError) as any : right.value);
				}
			}
			else {
				switch (operator) {
					case '*':
					case '/':
						return new UnitValue(Runtime.op(ctx, operator, this.value, right.value) as any, Runtime.op(ctx, operator, this.unit, right.unit) as any).simplify(ctx);
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
						return Util.resolveValueAndError(this.convertTo(ctx, right.unit), converted => Runtime.op(ctx, operator, converted, right), ()=>JelBoolean.valueOf(operator == '!=' || operator == '!=='));
					case '+':
					case '-':
						return Util.resolveValueAndError(this.convertTo(ctx, right.unit), converted => Runtime.op(ctx, operator, converted, right), ()=>Promise.reject(new Error(`Can not apply`)));
					case '+-':
						return Util.resolveValue(right.convertTo(ctx, this.unit), converted=>this.toApproxNumber(converted.value));
				}
			}
		}
		else if (right instanceof Float || right instanceof Fraction || right instanceof ApproximateNumber) {
				switch (operator) {
				case '*':
				case '/':
				case '^':
					return new UnitValue(Runtime.op(ctx, operator, this.value, right) as any, Runtime.op(ctx, operator, this.unit, right) as any).simplify(ctx);
				case '+-':
					if (right instanceof ApproximateNumber)
						return this.toApproxNumber(Runtime.op(ctx, '+', right.value, right.maxError) as any);
					else
						return this.toApproxNumber(right);
				}
		}
		return super.op(ctx, operator, right, isReversal);
	}
	
	private toApproxNumber(newError: Float | Fraction): UnitValue {
		if (this.value instanceof ApproximateNumber)
			return new UnitValue(new ApproximateNumber(this.value.value, newError), this.unit);
		else
			return new UnitValue(new ApproximateNumber(this.value, newError), this.unit);
	}
	
	singleOp(ctx: Context, operator: string): JelObject|Promise<JelObject> {
		if (operator == '!') 
			return Runtime.singleOp(ctx, operator, this.value);
		return super.singleOp(ctx, operator);
	}

	opReversed(ctx: Context, operator: string, left: JelObject): JelObject|Promise<JelObject> {
		if (left instanceof Float || left instanceof Fraction || left instanceof ApproximateNumber) {
			switch (operator) {
				case '*':
				case '/':
					return new UnitValue(Runtime.op(ctx, operator, left, this.value) as any, this.unit);
				}		
		}
		return super.opReversed(ctx, operator, left);
	}
	
	canConvertTo_jel_mapping: boolean;
	canConvertTo(ctx: Context, target: any): Promise<JelBoolean> | JelBoolean {
    return Util.resolveValueAndError(this.convertTo(ctx, target), ()=>JelBoolean.TRUE, ()=>JelBoolean.FALSE);
  }
  
	// returns the UnitValue converted to the given value, or returns rejected Promise if conversion not possible
	convertTo_jel_mapping: boolean;
	convertTo(ctx: Context, target: any): Promise<UnitValue> | UnitValue {
		if (target instanceof Unit) {
			if (!target.isSimple())
				return Promise.reject(new Error(`UnitValues can only convert to simple Unit types, but not to complex unit ${target.toString()}.`));
			return this.convertTo(ctx, target.toUnitReference(ctx).distinctName);
		}
		else if (typeof target != 'string')
			return this.convertTo(ctx, TypeChecker.dbRef(target, 'target').distinctName);

		if (this.unit.isSimple())
			return this.convertSimpleTo(ctx, target as string, false);
		else
			return this.convertComplexTo(ctx, target as string);
	}
	
	private convertSimpleTo(ctx: Context, target: string, mustBePrimaryUnit: boolean): Promise<UnitValue> | UnitValue {
		const simpleUnit: IDbRef = this.unit.toUnitReference(ctx);
		if (simpleUnit.distinctName == target)
			return this;
		
		return simpleUnit.withMember(ctx, 'convertsTo', (conversionDict: any) => {
			if (!(conversionDict instanceof Dictionary))
					return Promise.reject(new Error("Can not convert "+simpleUnit.distinctName+" to any other units. No convertsTo property defined."));

			const conversionObj: Dictionary | null | undefined = conversionDict.elements.get(target) as any;
			if (conversionObj != null) {
				const f: any = conversionObj.elements.get('f');
				if (f) {
					if (!(f instanceof Callable))
						return Promise.reject(new Error(`Broken configuration in ${simpleUnit.distinctName}.convertsTo.${target}: should be Callable, but is ${Serializer.serialize(f)}.`));
					return Util.resolveValue(f.invoke(undefined, this.value), v=>new UnitValue(v, target));
				}
				const factor: JelObject | null | undefined = conversionObj.elements.get('factor');
				if (factor != null)
					return Util.resolveValue(Runtime.op(ctx, '*', factor, this.value), v=>new UnitValue(v, target));
				else
					return Promise.reject(new Error("Can not convert from "+simpleUnit.distinctName+" to type " + target+": neither factor not function set."));
			}
			else 
				return simpleUnit.withMember(ctx, 'isPrimaryUnit', (isPrimaryUnit: any)=> {
					if (JelBoolean.toRealBoolean(isPrimaryUnit))
						return Promise.reject(new Error(`Can not convert from unit ${this.unit.toString()} to unit ${target}. No conversion rule available.`));

					return simpleUnit.withMember(ctx, 'quantityCategory', (qc: any)=> {
						if (!(qc && qc.isIDBEntry))
							return Promise.reject(new Error(`Unit ${simpleUnit.distinctName} is missing required property quantityCategory.`));

						return qc.withMember(ctx, 'primaryUnit', (primaryUnit: any) => {
							if (!(primaryUnit && primaryUnit.isIDBEntry))
								return Promise.reject(new Error(`Unit ${simpleUnit.distinctName} is missing required property primaryUnit.`));

							return primaryUnit.withMember(ctx, 'isPrimaryUnit', (isPrimaryUnit: any) => {
								if (!JelBoolean.toRealBoolean(isPrimaryUnit))
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
		return ctx.getSession().with(target, (targetEntry: NamedObject) =>{
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
	toPrimaryUnits_jel_mapping: boolean;
	toPrimaryUnits(ctx: Context): UnitValue | Promise<UnitValue> {
		let uv: UnitValue = this;
		const session = ctx.getSession();
		const unitRefs: IDbRef[] = Array.from(this.unit.units.keys()).map(r=>session.createDbRef(r));
		
		return Util.resolveArray(unitRefs.map(u=>u.member(ctx, 'isPrimaryUnit')), (unitEntryFilter: any[]) => {
			const nonPrimaryUnits: IDbRef[] = unitRefs.filter((u, i)=>!JelBoolean.toRealBoolean(unitEntryFilter[i]));
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
								const newUnitMap = new Map<string,number>(uv.unit.units);
								const exp: number = newUnitMap.get(oldUnit.distinctName) as any;
								newUnitMap.delete(oldUnit.distinctName);
								newUnitMap.set(primaryUnit.distinctName, (newUnitMap.get(primaryUnit.distinctName) || 0) as number + exp);
								if (t.elements.has('factor')) {
									uv = new UnitValue(Runtime.op(ctx, '*', uv.value, Runtime.op(ctx, '^', t.elements.get('factor') as any, Float.valueOf(exp)) as any) as any, new Unit(newUnitMap));
								}
								else if (t.elements.has('f') && exp == 1 && t.elements.get('f') instanceof Callable)
									uv = new UnitValue((t.elements.get('f') as Callable).invoke(undefined, uv.value) as any, new Unit(newUnitMap));
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
	simplify_jel_mapping: boolean;
	simplify(ctx: Context): UnitValue | Promise<UnitValue> {
		if (this.unit.isSimple())
			return this;
		return Util.resolveValue(this.trySimplification(ctx, this), t1=>t1 || Util.resolveValue(Util.resolveValue(this.toPrimaryUnits(ctx), t3=>this.trySimplification(ctx, t3)), t2=>t2 || this));
	}
	
	round_jel_mapping: boolean;
	round(ctx: Context, precision0: Float = Float.valueOf(1)): UnitValue {
    const precision = TypeChecker.realNumber(precision0, 'precision');
    if (precision == 1)
	  	return new UnitValue(this.value.round(ctx), this.unit);
    else
  		return new UnitValue(Float.valueOf(Math.round(Float.toRealNumber(this.value)*precision)/precision), this.unit);
	}
	
	abs_jel_mapping: boolean;
	abs(): UnitValue {
		return new UnitValue(this.value.abs(), this.unit);
	}
	
	negate_jel_mapping: boolean;
	negate(): UnitValue {
		return new UnitValue(this.value.negate(), this.unit);
	}
	
	toFloat_jel_mapping: boolean;
	toFloat(): Float {
		return this.value.toFloat();
	}
  	
	trunc_jel_mapping: boolean;
	trunc(): UnitValue {
		return new UnitValue(this.value.trunc() as any, this.unit);
	}
	
	toRealNumber(): number {
		return this.value.toRealNumber();
	}
	
	toString(): string {
		return this.value.toString() +' '+this.unit.toString();
	}
	
	isType_jel_mapping: boolean;
	isType(ctx: Context, unit: IDbRef | string): boolean {
		return this.unit.isType(ctx, unit);
	}
	
	isSimple_jel_mapping: boolean;
	isSimple(): boolean {
		return this.unit.isSimple();
	}
	
	toUnitReference_jel_mapping: boolean;
	toUnitReference(ctx: Context): IDbRef {
		return this.unit.toUnitReference(ctx);
	}

  static valueOf(value: Float | Fraction | ApproximateNumber, unit: IDbRef | Unit | string | JelString): UnitValue {
    return new UnitValue(value, unit);
  }

	getSerializationProperties(): any[] {
		return [this.value, this.unit];
	}
	
	static create_jel_mapping = ['value', 'unit'];
	static create(ctx: Context, ...args: any[]): UnitValue {
		return new UnitValue(TypeChecker.types(VALUE_TYPES, args[0], 'value'), (args[1] && (args[1] as any).isIDBRef) ? args[1] : TypeChecker.types(UNIT_TYPES, args[1], 'unit'));
	}
}

UnitValue.prototype.value_jel_property = true;
UnitValue.prototype.unit_jel_property = true;

UnitValue.prototype.reverseOps = Object.assign({'*':1, '/': 1}, JelObject.SWAP_OPS);
UnitValue.prototype.toFloat_jel_mapping = true;
UnitValue.prototype.abs_jel_mapping = true;
UnitValue.prototype.negate_jel_mapping = true;
UnitValue.prototype.canConvertTo_jel_mapping = true;
UnitValue.prototype.convertTo_jel_mapping = true;
UnitValue.prototype.round_jel_mapping = true;
UnitValue.prototype.trunc_jel_mapping = true;
UnitValue.prototype.simplify_jel_mapping = true;
UnitValue.prototype.isSimple_jel_mapping = true;
UnitValue.prototype.toUnitReference_jel_mapping = true;
UnitValue.prototype.toPrimaryUnits_jel_mapping = true;
UnitValue.prototype.isType_jel_mapping = true;

BaseTypeRegistry.register('UnitValue', UnitValue);
