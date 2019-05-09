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
 *   try e = anyValue() 
 *   catch MyException: 15
 *   catch: showError(e)
 */
export default class TryCatch extends TryElement {

  constructor(public type: JelNode|undefined, expression: JelNode) {
    super(expression, true);
  }
  
  // override
  execute(ctx:Context, value: JelObject|null): JelObject|null|Promise<JelObject|null|undefined>|undefined {
    if (this.type) 
      return Util.resolveValues((type: JelObject|null, v: JelObject|null)=>{
        const td: any = this.typeHelper.convertFromAny(type, "'catch' type descriptor");
        return Util.resolveValue(td.checkType(ctx, v), (s: any)=>s.toRealBoolean()?this.expression.execute(ctx): undefined);
      }, this.type.execute(ctx), value);
    else
      this.expression.execute(ctx)
  }
  
  
  // override
  equals(other?: TryElement): boolean {
		return (other instanceof TryCatch) &&
    this.expression.equals(other.expression) && 
    (this.type == other.type || (this.type != null && this.type.equals(other.type)));
	}
  
	toString(): string {
    if (this.type)
      return `catch ${this.type.toString()}: ${this.expression.toString()}`;
    else
    return `catch: ${this.expression.toString()}`;
	}
}

