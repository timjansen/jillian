import WorkerPool from './WorkerPool';
import Category from './dbObjects/Category';
import DatabaseContext from './DatabaseContext';
import DbRef from './DbRef';
import Database from './Database';
import NotFoundError from './NotFoundError';
import Context from '../jel/Context';
import Dictionary from '../jel/types/Dictionary';
import NamedObject from '../jel/types/NamedObject';
import {IDbRef, IDbSession} from '../jel/IDatabase';

const wp = new WorkerPool();

export default class DbSession implements IDbSession {
	readonly isIDBSession: boolean = true;
  cacheByName: Map<string, NamedObject|null> = new Map();   // distinct name -> entry; stores null for entries that have not been found. 
  cacheByHash: Map<string, NamedObject> = new Map();        // hash code -> entry
  public ctx: Context;
  
  constructor(public database: Database) {
    this.ctx = undefined as any;
  }

  static async create(database: Database): Promise<DbSession> {
    const ds = new DbSession(database);            
		ds.ctx = await DatabaseContext.get(ds);
    return ds;
  }
  
	// implements IDbSession
	createDbRef(distinctNameOrEntry: string | NamedObject): IDbRef {
		return new DbRef(distinctNameOrEntry);
	}
	
  // returns the entry, null if it does not exist, undefined if not in cache
  getFromCache(distinctName: string): NamedObject | null | undefined {
    return this.cacheByName.get(distinctName);
  }

  getFromDatabase(distinctName: string): Promise<NamedObject> {
    return this.database.get(this.ctx, distinctName)
      .then(dbEntry => this.storeInCache(dbEntry));
  }
  
  // return either a value or a Promise! Promise rejected with NotFoundError if not found.
  get(distinctName: string): Promise<NamedObject> | NamedObject {
    const cachedEntry = this.getFromCache(distinctName);
    if (cachedEntry != null)
      return cachedEntry;
		if (cachedEntry === null)
			return Promise.reject(new NotFoundError(distinctName));

    return this.getFromDatabase(distinctName);
  }

  getMember(distinctName: string, property: string): Promise<any> | any {
		const o = this.get(distinctName);
		if (o instanceof Promise)
			return o.then(p=>p.member(this.ctx, property) || null);
		else
			return o.member(this.ctx, property);
  }
	
	with<T>(distinctName: string, f: (o: NamedObject)=>T): Promise<T> | T {
    const cachedEntry = this.getFromCache(distinctName);
    if (cachedEntry != null)
      return f(cachedEntry);
		if (cachedEntry === null)
			return Promise.reject(new NotFoundError(distinctName));

    return this.getFromDatabase(distinctName).then(v=>f(v));
  }
	
	// Retrieves a single member from the object and calls the callback function with it. 
	withMember<T>(distinctName: string, name: string, f: (v: any)=>T): Promise<T> | T {
		return this.with(distinctName, o=>o.withMember(this.ctx, name, f)) as Promise<T> | T;
	}
	
  storeInCache(dbEntry: NamedObject): NamedObject {
    this.cacheByName.set(dbEntry.distinctName, dbEntry);
    this.cacheByHash.set(dbEntry.hashCode, dbEntry);
    return dbEntry;
  }
  
  // for debugging
  clearCacheInternal(): DbSession {
    this.cacheByName.clear();
    this.cacheByHash.clear();
    return this;
  }
  
  // returns promise
  put(...dbEntries: NamedObject[]): Promise<NamedObject[]> {
    return this.database.put(this.ctx, ...dbEntries.map(dbEntry=>this.storeInCache(dbEntry)));
  }

  // returns a promise containing list of dbEntries
  getByIndex(category: Category | DbRef, indexName: string, filterFunc: (x: NamedObject)=>boolean = x=>true): Promise<Category[]> {
    return DbRef.toPromise(this.ctx, category).then(cat=>
      this.database.readCategoryIndex(cat as Category, indexName).then(index=>{
        const cachedResults: Category[] = index.map(hash=>this.cacheByHash.get(hash)).filter(dbEntry=>dbEntry && filterFunc(dbEntry)!) as Category[];
        if (cachedResults.length == index.length)
          return Promise.resolve(cachedResults);
      
        const unloadedHashs = index.filter(hash=>!this.cacheByHash.has(hash));
    
        return wp.runJob(unloadedHashs, hash=>this.database.getByHash(this.ctx, hash).then(dbEntry=>(dbEntry && filterFunc(dbEntry)) ? this.storeInCache(dbEntry) : null))
          .then(results=>cachedResults.concat(results.filter((obj: NamedObject|null)=>!!obj) as Category[]));
      })
    );
  }
}

