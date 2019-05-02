import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import Assignment from './Assignment';
import Context from '../Context';
import JelObject from '../JelObject';
import {IDbRef, IDbSession} from '../IDatabase';
import Util from '../../util/Util';
import SourcePosition from '../SourcePosition';


/**
 * A reference looks up a named object in the database and returns it (or rather a promise to it).
 * 
 * Examples:
 *   @Bird    // returns the category Bird
 *	 @Mars    // returns the instance called Mars
 */
export default class Reference extends CachableJelNode {
	public ref: IDbRef | Promise<IDbRef> | undefined;
  constructor(position: SourcePosition, public name: string) {
    super(position);
  }
  
  // override
  executeUncached(ctx: Context): JelObject|null|Promise<JelObject|null> {
		const dbSession: IDbSession = ctx.getSession();
		if (!this.ref) {
  		this.ref = dbSession.createDbRef(this.name);
		}
    return this.ref as any;
  }
  
  isStaticUncached(ctx: Context): boolean {
    return false;
  }
  
  flushCache(): void {
    super.flushCache();
  }
  
  // overrride
  equals(other?: JelNode): boolean {
		return other instanceof Reference &&
      this.name == other.name;
	}
  
	toString(): string {
		return `@${this.name}`;	
	}

}

