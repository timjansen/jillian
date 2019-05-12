import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import BaseTypeRegistry from '../BaseTypeRegistry';
import JelObject from '../JelObject';
import Context from '../Context';
import Util from '../../util/Util';
import SourcePosition from '../SourcePosition';


/**
 * Represents a if/then/else condition. The 'else' part can be omitted. It will then return the boolean 'true', which is mainly intended for assumptions.
 *
 * Examples: 
 *     if a > 0 then 1 else 2
 *     if c instanceof @Cat then c instanceof @Animal
 */
export default class Condition extends CachableJelNode {
  jelBoolean: any;

  constructor(position: SourcePosition, public condition: JelNode, public thenExp: JelNode, public elseExp: JelNode) {
    super(position, [condition, thenExp, elseExp]);
    this.jelBoolean = BaseTypeRegistry.get('Boolean');
  }
  
  // override
  executeUncached(ctx: Context): JelObject|null|Promise<JelObject|null> {
    return Util.resolveValue(this.condition.execute(ctx), v=>this.runOnValue(ctx, v));
  }
  
  isStaticUncached(ctx: Context): boolean {
    return this.condition.isStatic(ctx) && this.thenExp.isStatic(ctx) && this.elseExp.isStatic(ctx);
  }
  
  // override
  equals(other?: JelNode): boolean {
		return other instanceof Condition &&
      this.condition.equals(other.condition) &&
      this.thenExp.equals(other.thenExp) &&
      this.elseExp.equals(other.elseExp);
	}

  flushCache(): void {
    super.flushCache();
    this.condition.flushCache();
    this.thenExp.flushCache();
    this.elseExp.flushCache();
  }

  private runOnValue(ctx: Context, cond: any): JelObject|null|Promise<JelObject|null> {
    if (this.jelBoolean.toRealBoolean(cond))
      return this.thenExp.execute(ctx);
    else
      return this.elseExp.execute(ctx);
  }

 	toString(): string {
		return `if ${this.condition.toString()} then ${this.thenExp.toString()} else ${this.elseExp.toString()}`;
	}
}

