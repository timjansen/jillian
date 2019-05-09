import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import Assignment from './Assignment';
import Context from '../Context';
import JelObject from '../JelObject';
import SourcePosition from '../SourcePosition';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Util from '../../util/Util';
import TryElement from './TryElement';


/**
 * Defines the 'when' in an Try clause
 * 
 * Examples:
 *   try a = anyValue() 
 *   when number: a+1
 *   when string: a+" "
 */
export default class TryWhen extends TryElement {

  constructor(public type: JelNode, expression: JelNode) {
    super(expression, false);
  }
  
  // override
  execute(ctx:Context, value: JelObject|null): JelObject|null|Promise<JelObject|null|undefined>|undefined {
    return Util.resolveValues((type: JelObject|null, v: JelObject|null)=>{
      const td: any = this.typeHelper.convertFromAny(type, "'when' type descriptor");
      return Util.resolveValue(td.checkType(ctx, v), (s: any)=>s.toRealBoolean()?this.expression.execute(ctx): undefined);
    }, this.type.execute(ctx), value);
  }
  
  
  // override
  equals(other?: TryElement): boolean {
		return (other instanceof TryWhen) &&
    this.expression.equals(other.expression) && 
    this.type.equals(other.type);
	}
  
	toString(): string {
		return `when ${this.type.toString()}: ${this.expression.toString()}`;
	}
}

