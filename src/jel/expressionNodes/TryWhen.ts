import JelNode from './JelNode';
import Context from '../Context';
import JelObject from '../JelObject';
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

  constructor(public type: JelNode) {
    super(false);
  }
  
  // override
  execute(ctx:Context, value: JelObject|null): JelObject|null|Promise<JelObject|null|undefined>|undefined {
    return Util.resolveValue(this.type.execute(ctx), (type: JelObject|null)=>{
      const td: any = this.typeHelper.convertFromAny(type, "'when' type descriptor");
      return Util.resolveValue(td.checkType(ctx, value), (s: any)=>s.toRealBoolean()?this.expression!.execute(ctx): undefined);
    });
  }
  
  
  // override
  equals(other?: TryElement): boolean {
		return (other instanceof TryWhen) &&
    this.expression!.equals(other.expression) && 
    this.type.equals(other.type);
	}
  
	toString(): string {
		return `when ${this.type.toString()}: ${this.expression!.toString()}`;
	}
}

