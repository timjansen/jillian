import JelNode from './JelNode';
import Variable from './Variable';
import JelType from '../JelType';
import Context from '../Context';
import Util from '../../util/Util';

export default class Operator extends JelNode {
  constructor(public operator: string, public left: JelNode, public right?: JelNode) {
    super();
  }

  // override
  execute(ctx: Context): any {
    switch (this.operator) {
    case '.':
    case '||':
    case '&&':
      return this.evaluateLeftFirstOp(ctx);

    default:
      if (this.right == null)
        return this.evaluateLeftFirstOp(ctx);
        
      return Util.resolveValues((l: any,r: any)=>JelType.op(this.operator, l, r), this.left.execute(ctx), this.right.execute(ctx));
      }
  }

  private evaluateLeftFirstOp(ctx: Context): any {
    return Util.resolveValue(left=>this.leftFirstOps(ctx, left), this.left.execute(ctx));
  }
  
  private leftFirstOps(ctx: Context, left: JelNode): any {
    switch (this.operator) {
    case '.':
      return this.callMethod(ctx, left);
    case '||':
      return this.or(ctx, left);
    case '&&':
      return this.and(ctx, left);
    default: 
      return JelType.singleOp(this.operator, left);
    }
  }
  
  private callMethod(ctx: Context, left: JelNode): any {
    if (!(this.right instanceof Variable))
        throw new Error('Operator "." must be followed by an identifier');
      return JelType.member(left, this.right.name);
  }
  
  private binaryOp(ctx: Context, left: JelNode, right: JelNode): any {
      return JelType.op(this.operator, left, right);
  }
  
  private and(ctx: Context, left: JelNode): boolean {
    return JelType.toBoolean(left) ? this.right!.execute(ctx) : left;
  }
  
  private or(ctx: Context, left: JelNode): boolean {
    return JelType.toBoolean(left) ? left : this.right!.execute(ctx);
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
			if (this.operator == '.')
				return `${this.left.toString()}.${this.right.toString()}`;
			else
				return `(${this.left.toString()} ${this.operator} ${this.right.toString()})`;
		}
		else
			return `${this.operator}(${this.left.toString()})`;
	}
	
  getSerializationProperties(): Object {
    if (this.right != null) 
      return {op: this.operator, left: this.left, right: this.right};
    else
      return {op: this.operator, left: this.left};
  }
}
