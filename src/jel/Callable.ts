import Context from './Context';
import JelObject from './JelObject';

/**
 * A type that can be called.
 */
export default abstract class Callable extends JelObject {
  /**
   * @param ctx the current Context. May be ignored when a Lambda is called. 
   * @param self a reference to the current instance if a method is called. Otherwise undefined.
   * @param args unnamed arguments
   * @param argObj a map of named arguments
   * @return the return value, may be a Promise 
   */
	abstract invokeWithObject(ctx: Context, self: JelObject | undefined, args: (JelObject|null)[], argObj?: Map<String, JelObject|null>): JelObject|null|Promise<JelObject|null>;
	
  /**
   * @param ctx the current Context. May be ignored when a Lambda is called. 
   * @param self a reference to the current instance if a method is called. Otherwise undefined.
   * @param args unnamed arguments
   * @return the return value, may be a Promise
   */
	invoke(ctx: Context, self: JelObject | undefined, ...args: (JelObject|null)[]): JelObject|null|Promise<JelObject|null> {
		return this.invokeWithObject(ctx, self, args);
	}
  
  abstract rebind(self: JelObject): Callable;

}

