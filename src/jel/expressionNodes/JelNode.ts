import JelObject from '../JelObject';
import Context from '../Context';
import SourcePosition from '../SourcePosition';
import RuntimeError from '../RuntimeError';
import SerializablePrimitive from '../SerializablePrimitive';
import Util from '../../util/Util';

/**
 * Represents a node in a JEL expression.
 */
export default abstract class JelNode implements SerializablePrimitive {
  constructor(public position: SourcePosition) {
  }
  
	// Returns either a value or a Promise for a value!
	execute(ctx: Context): JelObject|null|Promise<JelObject|null> {
    return Util.handleError(()=>this.executeImpl(ctx), e=>e instanceof RuntimeError ? e : new RuntimeError(this.position, e.message, e));
  }

  // Override this implementation for execute()!
	abstract executeImpl(ctx: Context): JelObject|null|Promise<JelObject|null>;
  
	abstract equals(other?: JelNode): boolean;
	
  // if true, the result is cachable
  abstract isStatic(ctx: Context): boolean;

  // flushes the cache in the expression tree, e.g. after changing the DB.
  abstract flushCache(): void;
  
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
