import Util from '../util/Util';
import BaseTypeRegistry from './BaseTypeRegistry';
import Context from './Context';


/**
 * A special Context that's always completely static. Also makes parent contexts static.
 */
export default class StaticContext extends Context {
	constructor(public parent?: Context) {
    super();
	}
	
 	hasInStaticScope(name: string): boolean {
		return true;
	}
	
	toString(): string {
		const vars = Array.from(this.frame.keys()).map((n: string)=>`${n}=${this.frame.get(n)}`).join(', ');
		return `StaticContext(frame={${vars}},\n   parent=${this.parent})`;
	}
}
