import Context from './Context';
import JelObject from './JelObject';
import NativeJelObject from './types/NativeJelObject';
import BaseTypeRegistry from './BaseTypeRegistry';

/**
 * A type that can be called.
 */
export default abstract class Callable extends NativeJelObject {
  
  /**
   * @param ctx the current Context. May be ignored when a Lambda is called. 
   * @param self a reference to the current instance if a method is called. Otherwise undefined.
   * @param args unnamed arguments
   * @param argObj a map of named arguments
   * @return the return value, may be a Promise 
   */
	abstract invokeWithObject(self: JelObject | undefined, args: (JelObject|null)[], argObj?: Map<String, JelObject|null>): JelObject|null|Promise<JelObject|null>;
	
  /**
   * @param ctx the current Context. May be ignored when a Lambda is called. 
   * @param self a reference to the current instance if a method is called. Otherwise undefined.
   * @param args unnamed arguments
   * @return the return value, may be a Promise
   */
	invoke(self?: JelObject, ...args: (JelObject|null)[]): JelObject|null|Promise<JelObject|null> {
		return this.invokeWithObject(self, args);
	}
  
  abstract rebind(self: JelObject): Callable;
  abstract bindParentContext(ctx: Context): Callable;

  abstract getArguments(): any[]|undefined; // returns array of TypedParameterValue, if there is any typing
  abstract getReturnType(): any|undefined;  // TypedParameterValue or undefined

}

const p: any = Callable.prototype;
p.invoke_jel_mapping = true;
p.getArguments_jel_mapping = true;
p.getReturnType_jel_mapping = true;

BaseTypeRegistry.register('Callable', Callable);
