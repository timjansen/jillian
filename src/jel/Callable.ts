import Context from './Context';

/**
 * A type that can be called.
 */
export default abstract class Callable {
	invokeWithObject(args: any[], argObj?: any, ctx?: Context): any {
	}
	
	invoke(...args: any[]): any {
		return this.invokeWithObject(args);
	}
	
	invokeWithContext(ctx: Context, ...args: any[]): any {
		return this.invokeWithObject(args, null, ctx);
	}
}

