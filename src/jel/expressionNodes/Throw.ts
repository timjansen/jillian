import JelNode from './JelNode';
import Context from '../Context';
import JelObject from '../JelObject';
import SourcePosition from '../SourcePosition';
import Util from '../../util/Util';
import TryElement from './TryElement';
import ScriptException from '../ScriptException';
import Runtime from '../Runtime';
import BaseTypeRegistry from '../BaseTypeRegistry';


/**
 * Defines a throw statement.
 * 
 * Examples:
 *   throw MyException("oops")
 *   throw "something happened"
 */
export default class Throw extends JelNode {
  constructor(position: SourcePosition, public expression: JelNode) {
    super(position);
  }
  
  // override
  executeImpl(ctx: Context): JelObject|null|Promise<JelObject|null> {
    return Util.resolveValue(this.expression.execute(ctx), e=>
      Promise.reject(new ScriptException(Runtime.instanceOf(ctx, e, 'Throwable') ? e : ctx.get('Exception').member(ctx, 'create').invoke(null, e)))
    );
  }
  
  isStatic(ctx: Context): boolean {
    return false;
  }

  flushCache(): void {
  }
  
  // override
  equals(other?: JelNode): boolean {
    return (other instanceof Throw) &&
			this.expression.equals(other.expression);
  }
  
	toString(): string {
		  return `throw (${this.expression.toString()})\n`;
	}
}

