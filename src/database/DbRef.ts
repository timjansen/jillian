import JelType from '../jel/JelType';
import Context from '../jel/Context';
import DbEntry from './DbEntry';
import DbSession from './DbSession';
import Database from './Database';

export default class DbRef extends JelType {
	distinctName: string;
	cached: DbEntry | undefined | null;    // stores null for entries that have not been found, undefined if the existance is unknown
	
	constructor(distinctNameOrEntry: string | DbEntry) {
		super();
		if (distinctNameOrEntry instanceof DbEntry) {
			this.distinctName = distinctNameOrEntry.distinctName;
			this.cached = distinctNameOrEntry;
		}
		else	
			this.distinctName = distinctNameOrEntry;
	}
	
	// returns either DbEntry or Promise!
	get(ctxOrSession: Context | DbSession): DbEntry | Promise<DbEntry|null> | null {
		const dbSession = DbRef.getSession(ctxOrSession);
	
		if (this.cached !== undefined)
			return this.cached;
		
		this.cached = dbSession.getFromCache(this.distinctName);
		if (this.cached !== undefined)
			return this.cached;
		else
			return dbSession.getFromDatabase(this.distinctName).then(r=>this.cached = r);
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
		return database.get(this.distinctName);
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

	static create_jel_mapping = {distinctName: 0, dbEntry: 0};
	static create(...args: any[]): any {
		if (args[0] instanceof DbRef)
			return args[0];
		return new DbRef(args[0]);
	}
}



