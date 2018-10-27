import Context from './Context';
import JelObject from './JelObject';

/**
 * A type that can be called.
 */
export default abstract class Callable extends JelObject {
	invokeWithObject(ctx: Context, args: any[], argObj?: any): any {
	}
	
	invoke(ctx: Context, ...args: any[]): any {
		return this.invokeWithObject(ctx, args);
	}
}

