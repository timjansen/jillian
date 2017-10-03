import JelType from '../JelType';
import Context from '../Context';
import Serializable from '../Serializable';

/**
 * Represents a node in a JEL expression.
 */
export default class JelNode extends JelType implements Serializable {
	// Returns either a value or a Promise for a value!
	execute(ctx: Context): any {
		throw new Error(`execute() not implemented in ${this.constructor.name}`);
	}
	
	equals(other: JelNode): boolean {
		throw new Error(`equals() not implemented in ${this.constructor.name}`);
	}
	
	// Returns always Promise for a value!
	executePromise(ctx: Context): Promise<any> {
		const r = this.execute(ctx);
		if (r instanceof Promise)
			return r;
		else
			return Promise.resolve(r);
	}
	
	getSerializationProperties(): any {
    return [];
  }

}
