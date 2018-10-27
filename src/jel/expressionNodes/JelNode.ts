import JelObject from '../JelObject';
import Runtime from '../Runtime';
import Context from '../Context';
import Serializable from '../Serializable';

/**
 * Represents a node in a JEL expression.
 */
export default class JelNode extends JelObject implements Serializable {
	// Returns either a value or a Promise for a value!
	execute(ctx: Context): JelObject|null|Promise<JelObject|null> {
		throw new Error(`execute() not implemented in ${this.constructor.name}`);
	}
	
	equals(other?: JelNode): boolean {
		throw new Error(`equals() not implemented in ${this.constructor.name}`);
	}
	
	// Returns always Promise for a value!
	executePromise(ctx: Context): Promise<JelObject|null> {
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
