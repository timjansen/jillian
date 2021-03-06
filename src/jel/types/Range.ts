import Util from '../../util/Util';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Runtime from '../Runtime';
import JelObject from '../JelObject';
import Class from './Class';
import NativeJelObject from './NativeJelObject';
import Context from '../Context';
import Float from './Float';
import Fraction from './Fraction';
import Callable from '../Callable';
import UnitValue from './UnitValue';
import ApproximateNumber from './ApproximateNumber';
import JelBoolean from './JelBoolean';
import TypeChecker from './TypeChecker';
const RANGE_NUM_OPS: any = {'+': true, '-': true, '*': true, '/': true};


/**
 * Represents a range of numeric values or time/dates. Ranges can be open-ended by passing a null for the min and/or max.
 */
export default class Range extends NativeJelObject {

  min_jel_property: boolean;
  max_jel_property: boolean;
  minExclusive_jel_property: boolean;
  maxExclusive_jel_property: boolean;
  minInt_jel_property: boolean;
  maxInt_jel_property: boolean;

  static clazz: Class|undefined;

	constructor(public min: JelObject | null, public max: JelObject | null, public minExclusive = false, public maxExclusive = false, className?: string) {
		super(className || 'Range');
	}
  
  get clazz(): Class {
    return Range.clazz!;
  }
	
	op(ctx: Context, operator: string, right: JelObject, isReversal: boolean = false): JelObject|Promise<JelObject> {
		if (operator == '!==')
			return (this.op(ctx, '===', right) as JelBoolean).negate();
		else if (operator == '!=')
			return (this.op(ctx, '==', right) as JelBoolean).negate();
		else if (right instanceof Range) {
			switch (operator) {
				case '==':
					return JelBoolean.orWithPromises(this.contains(ctx, right.min), this.contains(ctx, right.max), right.contains(ctx, this.min), right.contains(ctx, this.max));
				case '===':
					return JelBoolean.andWithPromises(Runtime.op(ctx, '===', this.min, right.min) as JelBoolean, Runtime.op(ctx, '===', this.max, right.max) as JelBoolean);
				case '>>':
					return (right.max == null || this.min == null) ? JelBoolean.FALSE : Runtime.op(ctx, '>>', this.min, right.max);
				case '<<':
					return (right.min == null || this.max == null) ? JelBoolean.FALSE : Runtime.op(ctx, '<<', this.max, right.min);
				case '>':
					return (this.max == null || right.max == null) ? JelBoolean.valueOf(this.max == null && right.max != null) : Runtime.op(ctx, '>', this.max, right.max);
				case '<':
					return (this.min == null || right.min == null) ? JelBoolean.valueOf(this.min == null && right.min != null) : Runtime.op(ctx, '<', this.min, right.min);
				case '>>=':
					return (this.min == null || right.max == null) ? JelBoolean.valueOf(this.min == right.max) : Runtime.op(ctx, '>>=', this.min, right.max); 
				case '<<=':
					return (this.max == null || right.min == null) ? JelBoolean.valueOf(this.max == right.min) : Runtime.op(ctx, '<<=', this.max, right.min);
				case '>=':
					return (this.max == null || right.max == null) ? JelBoolean.valueOf(this.max == null) : Runtime.op(ctx, '>=', this.max, right.max);
				case '<=':
					return (this.min == null || right.min == null) ? JelBoolean.valueOf(this.min == null) : Runtime.op(ctx, '<=', this.min, right.min);
			}
		}
		else if (right instanceof JelObject) {
			switch (operator) {
				case '==':
					return this.contains(ctx, right);
				case '===':
					return JelBoolean.andWithPromises(Runtime.op(ctx, '===', this.min, right) as JelBoolean, Runtime.op(ctx, '===', this.max, right) as JelBoolean);
				case '>>':
					return this.min != null ? Runtime.op(ctx, '>>', this.min, right) : JelBoolean.FALSE;
				case '<<':
					return this.max != null ? Runtime.op(ctx, '<<', this.max, right) : JelBoolean.FALSE;
				case '>':
					return this.min != null ? Runtime.op(ctx, '>', this.min, right) : JelBoolean.FALSE;
				case '<':
					return this.max != null ? Runtime.op(ctx, '<', this.max, right) : JelBoolean.FALSE;
				case '>>=':
					return JelBoolean.orWithPromises(this.op(ctx, '>>', right) as JelBoolean, this.contains(ctx, right));
				case '<<=':
					return JelBoolean.orWithPromises(this.op(ctx, '<<', right) as JelBoolean, this.contains(ctx, right));
				case '>=':
					return JelBoolean.orWithPromises(this.op(ctx, '>', right) as JelBoolean, this.contains(ctx, right));
				case '<=':
					return JelBoolean.orWithPromises(this.op(ctx, '<', right) as JelBoolean, this.contains(ctx, right));
				default:
					if (operator in RANGE_NUM_OPS)
						return new Range(this.min != null ? Runtime.op(ctx, operator, this.min, right) as any: this.min, 
														 this.max != null ? Runtime.op(ctx, operator, this.max, right) as any: this.max);
			}
		}
		return super.op(ctx, operator, right, isReversal);
	}
	
  get minInt(): number|null {
    if (this.max == null) {
      if (!TypeChecker.isNumeric(this.min))
        return null;
      const min = TypeChecker.realNumber(this.min, 'min', 0);
      const ceiled = Math.ceil(min);
      return this.minExclusive && ceiled==min ? ceiled+1 : ceiled;
    }
    
    if (!(TypeChecker.isNumeric(this.min) && TypeChecker.isNumeric(this.max)))
      return null;
    const min = TypeChecker.realNumber(this.min, 'min', 0);
    const max = TypeChecker.realNumber(this.max, 'max', 0);
    const ceiled = Math.ceil(min);
    const ceiledEx = this.minExclusive && ceiled==min ? ceiled+1 : ceiled;
    if (this.minExclusive ? ceiledEx >= max : ceiledEx > max)
      return null;
    else
      return ceiledEx;
    
  }

  get maxInt(): number|null {
    if (this.min == null) {
      if (!TypeChecker.isNumeric(this.max))
        return null;
      const max = TypeChecker.realNumber(this.max, 'max', 0);
      const floored = Math.floor(max);
      return this.maxExclusive && floored==max ? floored-1 : floored;
    }

    if (!(TypeChecker.isNumeric(this.min) && TypeChecker.isNumeric(this.max)))
      return null;
    const min = TypeChecker.realNumber(this.min, 'min', 0);
    const max = TypeChecker.realNumber(this.max, 'max', 0);
    const floored = Math.floor(max);
    const flooredEx = this.maxExclusive && floored==max ? floored-1 : floored;
    if (this.minExclusive ? flooredEx <= min : flooredEx < min)
      return null;
    else
      return flooredEx;
  }
   
	contains_jel_mapping: Object;
	contains(ctx: Context, right: JelObject | null): JelBoolean | Promise<JelBoolean> {
		if (right == null)
			return JelBoolean.valueOf(!this.isFinite());
		return JelBoolean.andWithPromises(this.min == null ? JelBoolean.TRUE : Runtime.op(ctx, this.minExclusive ? '<' : '<=', this.min, right) as JelBoolean, 
                                      this.max == null ? JelBoolean.TRUE : Runtime.op(ctx, this.maxExclusive ? '>' : '>=', this.max, right) as JelBoolean);
	}

	middle_jel_mapping: Object;
	middle(ctx: Context): JelObject | null {
		if (this.min != null && this.max != null)
			return Util.resolveValue(Runtime.op(ctx, '-', this.min, this.max), (x: any)=>x.abs());
		else
			return null;
	}

	isFinite_jel_mapping: Object;
	isFinite(): boolean {
		return this.min != null && this.max != null;
	}

 	isEmpty_jel_mapping: Object;
	isEmpty(ctx: Context): boolean | JelObject | Promise<JelObject>{
		return !this.min && !this.max && Runtime.op(ctx, '===', this.min, this.max);
	}

	getSerializationProperties(): any[] {
		return this.minExclusive || this.maxExclusive ? [this.min, this.max, this.minExclusive, this.maxExclusive] : [this.min, this.max];
	}
	
	static withAccuracy(value: number, accuracy: number): Range {
		return new Range(Float.valueOf(value - accuracy), Float.valueOf(value + accuracy));
	}
	
	static valueOf(min0: any, max0: any, minExclusive0 = false, maxExclusive0 = false): Range {
    const minIsRange = min0 instanceof Range;
    const maxIsRange = max0 instanceof Range;
    const min = minIsRange ? min0.min : (min0 || null);
    const max = maxIsRange ? max0.max : (max0 || null);
    const minExclusive = minIsRange ? min0.minExclusive : minExclusive0;
    const maxExclusive = maxIsRange ? max0.maxExclusive : maxExclusive0;
		return new Range(min, max, minExclusive, maxExclusive);
	}
	
	static create_jel_mapping = true;
	static create(ctx: Context, ...args: any[]): Range {
    const minIsRange = args[0] instanceof Range;
    const maxIsRange = args[1] instanceof Range;
    const min = minIsRange ? args[0].min : args[0] || null;
    const max = maxIsRange ? args[1].max : args[1] || null;
    const minExclusive = minIsRange ? args[0].minExclusive : TypeChecker.realBoolean(args[2], 'minExclusive', false);
    const maxExclusive = maxIsRange ? args[1].maxExclusive : TypeChecker.realBoolean(args[3], 'maxExclusive', false);
		return new Range(min, max, minExclusive, maxExclusive);
	}
}

Range.prototype.min_jel_property = true;
Range.prototype.max_jel_property = true;
Range.prototype.minExclusive_jel_property = true;
Range.prototype.maxExclusive_jel_property = true;
Range.prototype.minInt_jel_property = true;
Range.prototype.maxInt_jel_property = true;
Range.prototype.contains_jel_mapping = true;
Range.prototype.middle_jel_mapping = true;
Range.prototype.isFinite_jel_mapping = true;
Range.prototype.isEmpty_jel_mapping = true;
Range.prototype.reverseOps = JelObject.SWAP_OPS;

BaseTypeRegistry.register('Range', Range);

	