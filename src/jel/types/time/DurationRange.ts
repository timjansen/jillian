
import JelObject from '../../JelObject';
import Runtime from '../../Runtime';
import Context from '../../Context';
import Util from '../../../util/Util';
import Class from '../Class';
import Range from '../Range';
import Float from '../Float';
import JelBoolean from '../JelBoolean';
import UnitValue from '../UnitValue';
import Duration from './Duration';
import Fraction from '../Fraction';
import ApproximateNumber from '../ApproximateNumber';
import TypeChecker from '../TypeChecker';
import BaseTypeRegistry from '../../BaseTypeRegistry';

/**
 * A complex, calendar-based duration (simple durations, like year or seconds, can use UnitValue with Range)
 */
export default class DurationRange extends Range {
	static clazz: Class|undefined;
  
	constructor(min: Duration, max: Duration, minExclusive = false, maxExclusive = false) {
		super(min, max, minExclusive, maxExclusive, 'DurationRange');
		if (!min || !max)
			throw new Error('Min and max parameters are both required for a DurationRange)');
	}
	
  get clazz(): Class {
    return DurationRange.clazz!;
  }
  
	op(ctx: Context, operator: string, right: JelObject): JelObject|Promise<JelObject> {
		if ((right instanceof Duration) || (right instanceof UnitValue)) {
			switch (operator) {
				case '+':
				case '-':
					if (right instanceof UnitValue && !right.isType(ctx, 'Second'))
						return Util.resolveValue(right.convertTo(ctx, 'Second'), r=>this.op(ctx, operator, r));
					return new DurationRange(Runtime.op(ctx, operator, this.min, right) as Duration, Runtime.op(ctx, operator, this.max, right) as Duration);
			}
		}
		else if (right instanceof DurationRange) {
			switch (operator) {
				case '+':
				case '-': 
					return new DurationRange(Runtime.op(ctx, operator, this.min, right.min) as Duration, Runtime.op(ctx, operator, this.max, right.max) as Duration);
			}
		}
		else if (right instanceof Float || right instanceof Fraction || right instanceof ApproximateNumber) {
			switch (operator) {
				case '*':
				case '/':
					return new DurationRange(Runtime.op(ctx, operator, this.min, right) as Duration, Runtime.op(ctx, operator, this.max, right) as Duration);
			}
		}
		return super.op(ctx, operator, right);
	}

	contains_jel_mapping: boolean;
	contains(ctx: Context, value: any): JelBoolean {
		if (value == null)
			return JelBoolean.valueOf(!this.isFinite());
		if (value instanceof DurationRange)
			return this.contains(ctx, value.min).and(ctx, this.contains(ctx, value.max));
		return (Runtime.op(ctx, '>=', value, this.min) as JelBoolean).and(ctx, Runtime.op(ctx, '<=', value, this.max) as JelBoolean);
	}
	
	getSerializationProperties(): any[] {
		return [this.min, this.max];
	}
	
	static create_jel_mapping = true;
	static create(ctx: Context, ...args: any[]): DurationRange {
		return new DurationRange(TypeChecker.instance(Duration, args[0], 'min'), TypeChecker.instance(Duration, args[1], 'max'));
	}

}

DurationRange.prototype.contains_jel_mapping = true;
DurationRange.prototype.reverseOps = JelObject.SWAP_OPS;

BaseTypeRegistry.register('DurationRange', DurationRange);
