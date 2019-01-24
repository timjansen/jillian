import JelObject from '../JelObject';
import Context from '../Context';
import SerializablePrimitive from '../SerializablePrimitive';

/**
 * Represents a node in a JEL expression.
 */
export default abstract class JelNode implements SerializablePrimitive {

  
	// Returns either a value or a Promise for a value!
	abstract execute(ctx: Context): JelObject|null|Promise<JelObject|null>;
	
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
