import JelType from '../jel/JelType';
import Context from '../jel/Context';
import DbEntry from './DbEntry';
import DbSession from './DbSession';
import Database from './Database';

// Proxy to use when the DbRef has parameters.
class ParameterProxy extends DbEntry {
	constructor(public dbEntry: DbEntry, public parameters: Map<string, any>) {
		super(dbEntry.distinctName, dbEntry.reality, dbEntry.hashCode);
	}
	
	op(operator: string, right: any): any {
		return this.dbEntry.op(operator, right);
	}

	opReversed(operator: string, left: any): any {
		return this.dbEntry.opReversed(operator, left);
	}

	singleOp(operator: string): any {
		return this.dbEntry.singleOp(operator);
	}

	member(name: string, parameters?: Map<string, any>): any {
		if (parameters && this.parameters)
			return this.dbEntry.member(name, new Map([...this.parameters, ...parameters]) as any);
		else if (parameters)
			return this.dbEntry.member(name, parameters);
		else
			return this.dbEntry.member(name, this.parameters);
	}
	
}

export default class DbRef extends JelType {
	distinctName: string;
	cached: DbEntry | undefined | null;    // stores null for entries that have not been found, undefined if the existance is unknown
	
	constructor(distinctNameOrEntry: string | DbEntry, public parameters?: Map<string, any>) {
		super();
		if (distinctNameOrEntry instanceof DbEntry) {
			this.distinctName = distinctNameOrEntry.distinctName;
			this.cached = this.addProxy(distinctNameOrEntry);
		}
		else
			this.distinctName = distinctNameOrEntry;
	}
	
	// returns either DbEntry or Promise!
	get(ctxOrSession: Context | DbSession): DbEntry | Promise<DbEntry|null> | null {
		const dbSession = DbRef.getSession(ctxOrSession);
	
		if (this.cached !== undefined)
			return this.cached;
		
		this.cached = this.addProxy(dbSession.getFromCache(this.distinctName));
		if (this.cached !== undefined)
			return this.cached;
		else
			return dbSession.getFromDatabase(this.distinctName).then(r=>(this.cached = this.addProxy(r)) || null);
	}
	
	getAsync(ctxOrSession: Context | DbSession): Promise<DbEntry|null> {
		const v = this.get(ctxOrSession);
		if (v instanceof Promise)
			return v;
		else
			return Promise.resolve(v);
	}

	// returns either DbEntry or Promise!
	getFromDb(database: Database): DbEntry | Promise<DbEntry|null> | null {
		if (this.cached !== undefined)
			return this.cached;
		return database.get(this.distinctName).then(d=>this.addProxy(d) || null);
	}
	
	get isAvailable(): boolean {
		return this.cached !== undefined;
	}
	
  getSerializationProperties(): string[] {
    return [this.distinctName];
  }	
	
  static toPromise(ctxOrSession: Context | DbSession, ref: DbRef | DbEntry): Promise<DbEntry | null> {
		return Promise.resolve(ref instanceof DbRef ? ref.get(DbRef.getSession(ctxOrSession)) : ref);
	}
  
 	static getSession(ctxOrSession: Context | DbSession): DbSession {
		const dbSession = ctxOrSession instanceof Context ? ctxOrSession.dbSession : ctxOrSession;
		if (!dbSession)
			throw new Error('Can not execute DbRef without DatabaseSession in context.');
		return dbSession;
	}
	
	private addProxy(original: DbEntry|undefined|null): DbEntry|undefined|null {
		if (this.parameters && original)
			return new ParameterProxy(original, this.parameters);
		else
			return original;
	}

	static create_jel_mapping = {distinctName: 0, dbEntry: 0};
	static create(...args: any[]): any {
		if (args[0] instanceof DbRef)
			return args[0];
		return new DbRef(args[0]);
	}
}



