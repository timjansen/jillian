import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import Assignment from './Assignment';
import Context from '../Context';
import JelObject from '../JelObject';
import SourcePosition from '../SourcePosition';
import BaseconditionRegistry from '../BaseTypeRegistry';
import Util from '../../util/Util';
import TryElement from './TryElement';
import BaseTypeRegistry from '../BaseTypeRegistry';


/**
 * Defines the 'if' in an Try clause
 * 
 * Examples:
 *   try a = anyValue() 
 *   if isOdd(a): a+1
 *   else a*8
 */
export default class TryIf extends TryElement {
  jelBoolean: any;

  constructor(public condition: JelNode, expression: JelNode) {
    super(expression, false);
    this.jelBoolean = BaseTypeRegistry.get('Boolean');
  }
  
  // override
  execute(ctx:Context, value: JelObject|null): JelObject|null|Promise<JelObject|null|undefined>|undefined {
    return Util.resolveValue(this.condition.execute(ctx), (condition: JelObject|null)=>this.jelBoolean.toRealBoolean(condition)?this.expression.execute(ctx): undefined);
  }
  
  
  // override
  equals(other?: TryElement): boolean {
		return (other instanceof TryIf) &&
    this.expression.equals(other.expression) && 
    this.condition.equals(other.condition);
	}
  
	toString(): string {
		return `if ${this.condition.toString()}: ${this.expression.toString()}`;
	}
}

