import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import Assignment from './Assignment';
import Context from '../Context';
import JelObject from '../JelObject';
import {IDbRef, IDbSession} from '../IDatabase';
import Util from '../../util/Util';


function resolveValueMap(ctx: Context, assignments: Assignment[]): Map<string, any>|Promise<Map<string, any>> {
	const values: any = assignments.map(a=>a.execute(ctx));
	if (Util.hasAny(values, v=>v instanceof Promise))
		return Promise.all(values).then(resolvedValues=>new Map(assignments.map((a, i)=>[a.name, resolvedValues[i]]) as any) as any);
	else
		return new Map(assignments.map((a, i)=>[a.name, values[i]]) as any);		
}

/**
 * A reference looks up a named object in the database and returns it (or rather a promise to it).
 * 
 * Examples:
 *   @Bird    // returns the category Bird
 *	 @Mars    // returns the instance called Mars
 *	 @Mars(a=2, b="hello")    // returns the instance called Mars modified with the given parameters
 */
export default class Reference extends CachableJelNode {
	public ref: IDbRef | Promise<IDbRef> | undefined;
  constructor(public name: string, public parameters: Assignment[] = []) {
    super();
  }
  
  // override
  executeUncached(ctx: Context): JelObject|null|Promise<JelObject|null> {
		const dbSession: IDbSession = ctx.getSession();
		if (!this.ref) {
			if (!this.parameters.length)
				this.ref = dbSession.createDbRef(this.name);
			else {
				const params = resolveValueMap(ctx, this.parameters);
				if (params instanceof Promise)
					this.ref = params.then(p=>this.ref = dbSession.createDbRef(this.name, p));
				else
					this.ref = dbSession.createDbRef(this.name, params);
			}
		}
    return this.ref as any;
  }
  
  isStaticUncached(ctx: Context): boolean {
    return true;
  }
  
  flushCache(): void {
    super.flushCache();
    this.parameters.forEach(a=>a.flushCache());
  }
  
  // overrride
  equals(other?: JelNode): boolean {
		return other instanceof Reference &&
      this.name == other.name && 
			this.parameters.length == other.parameters.length && 
      !this.parameters.find((l, i)=>!l.equals(other.parameters[i]));;
	}
  
	toString(): string {
		if (this.parameters.length)
			return `@${this.name}(${this.parameters.map(s=>s.toString()).join(', ')})`;	
		else
			return `@${this.name}`;	
	}
	
  getSerializationProperties(): any[] {
    return [this.name, this.parameters];
  }
}

