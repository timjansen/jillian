import JelNode from './JelNode';
import Context from '../Context';
import JelObject from '../JelObject';
import Util from '../../util/Util';
import TryElement from './TryElement';


/**
 * Defines the 'case' in an Try clause
 * 
 * Examples:
 *   try a = anyValue() 
 *   case 1: a+1
 *   case 2: a+5
 */
export default class TryCase extends TryElement {

  constructor(public comparisonValue: JelNode, expression: JelNode) {
    super(expression, false);
  }
  
  // override
  execute(ctx:Context, value: JelObject|null): JelObject|null|Promise<JelObject|null|undefined>|undefined {
    return Util.resolveValue(this.comparisonValue.execute(ctx), (comparisonValue: JelObject|null)=>{
      if (comparisonValue == value)
        return this.expression.execute(ctx);
      if (!comparisonValue || !value)
        return undefined;
      return Util.resolveValue(comparisonValue.op(ctx, '==', value), (r: any)=>r.toRealBoolean()?this.expression.execute(ctx): undefined);
    });
  }
  
  
  // override
  equals(other?: TryElement): boolean {
		return (other instanceof TryCase) &&
    this.expression.equals(other.expression) && 
    this.comparisonValue.equals(other.comparisonValue);
	}
  
	toString(): string {
		return `case ${this.comparisonValue.toString()}: ${this.expression.toString()}`;
	}
}

