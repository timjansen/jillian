import Context from './Context';

/**
 * A type that can be called.
 */
export default abstract class Callable {
	invokeWithObject(ctx: Context, args: any[], argObj?: any): any {
	}
	
	invoke(ctx: Context, ...args: any[]): any {
		return this.invokeWithObject(ctx, args);
	}
}

