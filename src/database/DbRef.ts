import JelType from '../jel/JelType';
import Context from '../jel/Context';
import FuzzyBoolean from '../jel/types/FuzzyBoolean';
import {IDbRef} from '../jel/IDatabase';
import DbEntry from './DbEntry';
import DbSession from './DbSession';
import Database from './Database';


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
	
	// returns either DbEntry or Promise!
	get(dbSession: DbSession): DbEntry | Promise<DbEntry|null> | null {
		if (this.cached !== undefined)
			return this.cached;
		
		this.cached = dbSession.getFromCache(this.distinctName);
		if (this.cached !== undefined)
			return this.cached;
		else
			return dbSession.getFromDatabase(this.distinctName).then(r=>(this.cached = r) || null);
	}

	// Executes function with the object
	with(dbSession: DbSession, f: (obj: DbEntry|null)=>any): any {
		if (this.cached !== undefined)
			return f(this.cached);
		
		this.cached = dbSession.getFromCache(this.distinctName);
		if (this.cached !== undefined)
			return f(this.cached);
		else
			return dbSession.getFromDatabase(this.distinctName).then(r=>f((this.cached = r) || null));
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
		return this.with(ctx.dbSession, o=>this.memberInternal(ctx, o, name, parameters));
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
	
	getAsync(dbSession: DbSession): Promise<DbEntry|null> {
		const v = this.get(dbSession);
		if (v instanceof Promise)
			return v;
		else
			return Promise.resolve(v);
	}

	// returns either DbEntry or Promise!
	getFromDb(database: Database): DbEntry | Promise<DbEntry|null> | null {
		if (this.cached !== undefined)
			return this.cached;
		return database.get(this.distinctName);
	}
	
	get isAvailable(): boolean {
		return this.cached !== undefined;
	}
	
  getSerializationProperties(): any[] {
    return [this.distinctName, this.parameters];
  }	
	
  static toPromise(dbSession: DbSession, ref: DbRef | DbEntry): Promise<DbEntry | null> {
		return Promise.resolve(ref instanceof DbRef ? ref.get(dbSession) : ref);
	}
  
	static create_jel_mapping = {distinctName: 0, dbEntry: 0, parameters: 1};
	static create(...args: any[]): any {
		if (args[0] instanceof DbRef)
			return args[0];
		return new DbRef(args[0], args[1]);
	}
}



