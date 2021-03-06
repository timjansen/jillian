import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import Variable from './Variable';
import BaseTypeRegistry from '../BaseTypeRegistry';
import JelObject from '../JelObject';
import Runtime from '../Runtime';
import Context from '../Context';
import Util from '../../util/Util';
import SourcePosition from '../SourcePosition';

/**
 * Represents a standard operator. Will evaluate both left and right, except for the operators '.', '||' and '&&' which will evaluate only the
 * left operand and only execute the right operand when required.
 *
 * Examples:
 *  3+4
 *	12-11
 *	12*15
 *	8/2
 *	4+2*3           // returns 10, because of precedence rules
 *	(4+2)*3         // returns 12
 *	value == "foo"
 *  "foo" != value
 *	!someCondition
 *	-(4*4)
 *	cond1 && cond2
 *	cond1 || cond2
 *	obj.property   // note that if obj is null, it returns null. No exceptions.
 *	obj.property > 2 || obj.property < 0
 *	mul(6, 7)
 *	obj.print("hello")
 * 
 */ 
export default class Operator extends CachableJelNode {
		
  constructor(position: SourcePosition, public operator: string, public left: JelNode, public right?: JelNode) {
    super(position, right ? [left, right] : [left]);
  }

  // override
  executeUncached(ctx: Context): JelObject|null|Promise<JelObject|null> {
    switch (this.operator) {
    case '.':
    case '.?':
    case '||':
    case '&&':
      return this.evaluateLeftFirstOp(ctx);

    default:
      if (this.right == null)
        return this.evaluateLeftFirstOp(ctx);

      return Util.resolveValues((l: any,r: any)=>Runtime.op(ctx, this.operator, l, r), this.left.execute(ctx), this.right.execute(ctx));
    }
  }

  isStaticUncached(ctx: Context): boolean {
    return this.left.isStatic(ctx) && (!this.right || this.right.isStatic(ctx));
  }
  
  flushCache(): void {
    super.flushCache();
    this.left.flushCache();
    if (this.right) this.right.flushCache();
  }
  
  private evaluateLeftFirstOp(ctx: Context): JelObject|null|Promise<JelObject|null> {
    return Util.resolveValue(this.left.execute(ctx), left=>this.leftFirstOps(ctx, left));
  }
  
  private leftFirstOps(ctx: Context, left: JelObject|null): JelObject|null|Promise<JelObject|null> {
    switch (this.operator) {
    case '.':
      return this.readMember(ctx, left, false);
    case '.?':
      return this.readMember(ctx, left, true);
    case '||':
    	return BaseTypeRegistry.get('Boolean').toRealBoolean(left) ? left : this.right!.execute(ctx);
    case '&&':
    	return BaseTypeRegistry.get('Boolean').toRealBoolean(left) ? this.right!.execute(ctx) : left;
    default:
      return Runtime.singleOp(ctx, this.operator, left);
    }
  }
  
  private readMember(ctx: Context, left: JelObject|null, forgiving: boolean): JelObject|null|Promise<JelObject|null> {
    if (!(this.right instanceof Variable))
        throw new Error(`Operator "${this.operator}" must be followed by an identifier`);
      return Runtime.member(ctx, left, this.right.name, forgiving);
  }
  
  private binaryOp(ctx: Context, left: JelObject|null, right: JelObject|null): JelObject|null|Promise<JelObject|null> {
      return Runtime.op(ctx, this.operator, left, right);
  }
    
  
  // overrride
  equals(other?: JelNode): boolean {
		return other instanceof Operator &&
      this.operator == other.operator && 
      this.left.equals(other.left) &&
      (!this.right == !other.right) &&
      ((!this.right) || this.right!.equals(other.right));
	}
  
	toString(): string {
		if (this.right) {
			if (this.operator == '.' ||  this.operator == '.?')
				return `${this.left.toString()}.${this.right.toString()}`;
			else
				return `(${this.left.toString()} ${this.operator} ${this.right.toString()})`;
		}
		else
			return `(${this.operator}${this.left.toString()})`;
	}

}

