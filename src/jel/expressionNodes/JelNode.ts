import JelObject from '../JelObject';
import Context from '../Context';
import SourcePosition from '../SourcePosition';
import SerializablePrimitive from '../SerializablePrimitive';
import Util from '../../util/Util';
import ScriptException from '../ScriptException';
import BaseTypeRegistry from '../BaseTypeRegistry';
import ChainableError from '../../util/ChainableError';

/**
 * Represents a node in a JEL expression.
 */
export default abstract class JelNode implements SerializablePrimitive {
  public parent: JelNode;

  constructor(public position: SourcePosition, public children: JelNode[] = []) {
    for (let c of children) 
      c.parent = this;
  }

	// Returns either a value or a Promise for a value!
	execute(ctx: Context): JelObject|null|Promise<JelObject|null> {
    return Util.handleError(()=>this.executeImpl(ctx), e=>{
      if (e instanceof ScriptException)
        throw this.addStackFrame(ctx, e);

      const runtimeError = BaseTypeRegistry.get('RuntimeError');
      if (e instanceof runtimeError)
        throw new ScriptException(e.addStackEntryJs(ctx, this.getSourcePosition(ctx)));
      else
       throw new ScriptException(runtimeError.valueOf(e.toString(), e instanceof ChainableError && e.stack ? e.stack : undefined, this.getSourcePosition(ctx)));
    });
  }

  // Override this implementation for execute()!
	abstract executeImpl(ctx: Context): JelObject|null|Promise<JelObject|null>;
  
	abstract equals(other?: JelNode): boolean;
	
  // if true, the result is cachable
  abstract isStatic(ctx: Context): boolean;

  // flushes the cache in the expression tree, e.g. after changing the DB.
  abstract flushCache(): void;
  
  getSourcePosition(ctx: Context): string {
    const m = this.getCurrentMethod(ctx);
    if (m)
      return `${m} [${this.position.src}:${this.position.line}:${this.position.column}]`;
    else
      return `[${this.position.src}:${this.position.line}:${this.position.column}]`;
  }

  getCurrentMethod(ctx: Context): string|undefined {
    return this.parent && this.parent.getCurrentMethod(ctx);
  }

  getCurrentClass(ctx: Context): string|undefined {
    return this.parent && this.parent.getCurrentClass(ctx);
  }


  // override to add a stack frame to the exception. Should be overriden by nodes that do calls.
  addStackFrame(ctx: Context, e: ScriptException): ScriptException {
    return e;
  }

	// Returns always Promise for a value!
	executePromise(ctx: Context): Promise<JelObject|null> {
		const r = this.execute(ctx);
		if (r instanceof Promise)
			return r;
		else
			return Promise.resolve(r);
	}
	
  serializeToString(): string {
    return this.toString();
  }
}
