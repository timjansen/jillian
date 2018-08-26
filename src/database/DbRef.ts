import JelType from '../jel/JelType';
import Context from '../jel/Context';
import FuzzyBoolean from '../jel/types/FuzzyBoolean';
import {IDbRef} from '../jel/IDatabase';
import DbEntry from './DbEntry';
import DbSession from './DbSession';
import Database from './Database';
import NotFoundError from './NotFoundError';


export default class DbRef extends JelType implements IDbRef {
	distinctName: string;
	cached: DbEntry | undefined | null;    // stores null for entries that have not been found, undefined if the existance is unknown
	isIDBRef = true;
	
	constructor(distinctNameOrEntry: string | DbEntry, public parameters?: Map<string, any>) {
		super();
		if (distinctNameOrEntry instanceof DbEntry) {
			this.distinctName = distinctNameOrEntry.distinctName;
			this.cached = distinctNameOrEntry;
		}
		else
			this.distinctName = distinctNameOrEntry;
	}
	
	// returns either DbEntry or Promise! Rejects promise if not found.
	get(ctx: Context): DbEntry | Promise<DbEntry> {
		if (this.cached != null)
			return this.cached;
		else if (this.cached === null)
			return Promise.reject(new NotFoundError(this.distinctName));
		
		this.cached = ctx.dbSession.getFromCache(this.distinctName);
		if (this.cached != null)
			return this.cached;
		else if (this.cached === null)
			return Promise.reject(new NotFoundError(this.distinctName));
		else
			return ctx.dbSession.getFromDatabase(this.distinctName)
				.then((r: DbEntry)=>this.cached = r)
				.catch((e: any)=>{
					if (e instanceof NotFoundError)
						this.cached = null;
					return e;
				});
	}

	// Executes function with the object
	with(ctx: Context, f: (obj: DbEntry)=>any): any {
		if (this.cached != null)
			return f(this.cached);
		else if (this.cached === null)
			return Promise.reject(new NotFoundError(this.distinctName));

		this.cached = ctx.dbSession.getFromCache(this.distinctName);
		if (this.cached != null)
			return f(this.cached);
		else if (this.cached === null)
			return Promise.reject(new NotFoundError(this.distinctName));
		else
			return ctx.dbSession.getFromDatabase(this.distinctName)
				.then((r: DbEntry)=>f(this.cached = r))
				.catch((e: any)=>{
					if (e instanceof NotFoundError)
						this.cached = null;
					return e;
				});
	}

	hasSameParameters(right: DbRef): boolean {
		if (!this.parameters != !right.parameters)
			return false;
		if (!this.parameters || !right.parameters)
			return true;
		if (this.parameters.size != right.parameters.size)
			return false;
		for (let a in this.parameters.keys())
			if ((!right.parameters.has(a)) || this.parameters.get(a) !== right.parameters.get(a))
				return false;
		return true;
	}

	private memberInternal(ctx: Context, obj: DbEntry | null, name: string, parameters?: Map<string, any>): any {
		if (obj === null)
			return null;
		else if (parameters && this.parameters)
			return obj.member(ctx, name, new Map([...this.parameters, ...parameters]) as any);
		else if (parameters)
			return obj.member(ctx, name, parameters);
		else
			return obj.member(ctx, name, this.parameters);
	}
	
	member(ctx: Context, name: string, parameters?: Map<string, any>): any {
		return this.with(ctx, o=>this.memberInternal(ctx, o, name, parameters));
	}
	
	op(ctx: Context, operator: string, right: any): any {
		if (right instanceof DbRef) {
			switch(operator) {
				case '==':
					return FuzzyBoolean.toFuzzyBoolean(this.distinctName == right.distinctName);
				case '!=':
					return FuzzyBoolean.toFuzzyBoolean(this.distinctName != right.distinctName);
				case '===':
					return FuzzyBoolean.fourWay(this.distinctName == right.distinctName, this.hasSameParameters(right));
				case '!==':
					return FuzzyBoolean.fourWay(this.distinctName == right.distinctName, this.hasSameParameters(right)).negate();
			}
		}
		return super.op(ctx, operator, right);
	}
	
	getAsync(ctx: Context): Promise<DbEntry|null> {
		const v = this.get(ctx);
		if (v instanceof Promise)
			return v;
		else
			return Promise.resolve(v);
	}

	// returns either DbEntry or Promise!
	getFromDb(ctx: Context): DbEntry | Promise<DbEntry> {
		if (this.cached != null)
			return this.cached;
		else if (this.cached === null)
			return Promise.reject(new NotFoundError(this.distinctName));
		else
			return ctx.dbSession.getFromDatabase(this.distinctName);
	}
	
	get isAvailable(): boolean {
		return this.cached !== undefined;
	}
	
  getSerializationProperties(): any[] {
    return [this.distinctName, this.parameters];
  }	
	
  static toPromise(ctx: Context, ref: DbRef | DbEntry): Promise<DbEntry | null> {
		return Promise.resolve(ref instanceof DbRef ? ref.get(ctx) : ref);
	}
  
	static create_jel_mapping = {distinctName: 0, dbEntry: 0, parameters: 1};
	static create(...args: any[]): any {
		if (args[0] instanceof DbRef)
			return args[0];
		return new DbRef(args[0], args[1]);
	}
}



