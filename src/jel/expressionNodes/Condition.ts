import JelNode from './JelNode';
import JelType from '../JelType';
import Context from '../Context';
import Util from '../../util/Util';


export default class Condition extends JelNode {
  constructor(public condition: JelNode, public thenExp: JelNode, public elseExp: JelNode) {
    super();
  }
  
  // override
  execute(ctx: Context): any {
    return Util.resolveValue(v=>this.runOnValue(ctx, v), this.condition.execute(ctx));
  }
  
  // override
  equals(other?: JelNode): boolean {
		return other instanceof Condition &&
      this.condition.equals(other.condition) &&
      this.thenExp.equals(other.thenExp) &&
      this.elseExp.equals(other.elseExp);
	}


  private runOnValue(ctx: Context, cond: any): any {
    if (JelType.toBoolean(cond))
      return this.thenExp.execute(ctx);
    else
      return this.elseExp.execute(ctx);
  }

 	toString(): string {
		return `if ${this.condition.toString()} then ${this.thenExp.toString()} else ${this.elseExp.toString()}`;
	}
 
	getSerializationProperties(): Object {
    return {condition: this.condition, thenExp: this.thenExp, elseExp: this.elseExp};
  }
}
