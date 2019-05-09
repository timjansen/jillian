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
  constructor(public position: SourcePosition) {
  }
  
	// Returns either a value or a Promise for a value!
	execute(ctx: Context): JelObject|null|Promise<JelObject|null> {
    return Util.handleError(()=>this.executeImpl(ctx), e=>{
      if (e instanceof ScriptException)
        throw this.addStackFrame(e);
      else {
        const runtimeError = BaseTypeRegistry.get('RuntimeError');
       throw new ScriptException(runtimeError.valueOf(e.toString(), e instanceof ChainableError && e.stack ? e.stack : undefined, `at ${this.getSourcePosition()}`));
      }
    });
  }

  // Override this implementation for execute()!
	abstract executeImpl(ctx: Context): JelObject|null|Promise<JelObject|null>;
  
	abstract equals(other?: JelNode): boolean;
	
  // if true, the result is cachable
  abstract isStatic(ctx: Context): boolean;

  // flushes the cache in the expression tree, e.g. after changing the DB.
  abstract flushCache(): void;
  
  getSourcePosition(): string {
    return `(${this.position.src}:${this.position.line}:${this.position.column})`;
  }

  // override to add a stack frame to the exception
  addStackFrame(e: ScriptException): ScriptException {
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
