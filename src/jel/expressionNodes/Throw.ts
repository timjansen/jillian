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
    super(position, [expression]);
  }
  
  // override
  executeImpl(ctx: Context): JelObject|null|Promise<JelObject|null> {
    return Util.resolveValue(this.expression.execute(ctx), e=> {
      const exE = Runtime.instanceOf(ctx, e, 'Throwable') ? e : (
        Runtime.instanceOf(ctx, e, 'String') ? ctx.get('Exception').member(ctx, 'create').invoke(null, e) : 
        BaseTypeRegistry.get('RuntimeError').valueOf(`Bad 'throw' statement. Argument must be Throwable or String.`));
      return Promise.reject(this.addStackFrame(ctx, new ScriptException(exE)));
    }
    );
  }

  // override  
  addStackFrame(ctx: Context, e: ScriptException): ScriptException {
    return new ScriptException((e.exception.member(ctx, 'addStackEntry') as any).invoke(e.exception, BaseTypeRegistry.get('String').valueOf(this.getSourcePosition(ctx))));
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

