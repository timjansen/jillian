import WorkerPool from './WorkerPool';
import Category from './dbObjects/Category';
import DbRef from './DbRef';
import DbEntry from './DbEntry';
import Database from './Database';
import Context from '../jel/Context';

const wp = new WorkerPool();

export default class DbSession {
  cacheByName: Map<string, DbEntry|null> = new Map();   // distinct name -> entry; stores null for entries that have not been found. 
  cacheByHash: Map<string, DbEntry> = new Map();       // hash code -> entry
  
  constructor(public database: Database) {
  }

  // returns the entry, null if it does not exist, undefined if not in cache
  getFromCache(distinctName: string): DbEntry | null | undefined {
    return this.cacheByName.get(distinctName);
  }

  getFromDatabase(distinctName: string): Promise<DbEntry|null> {
    return this.database.get(distinctName)
      .then(dbEntry => (dbEntry && this.storeInCache(dbEntry)) || null);
  }
  
  // return either a value or a Promise!
  get(distinctName: string): Promise<DbEntry|null> | DbEntry | null {
    const cachedEntry = this.getFromCache(distinctName);
    if (cachedEntry !== undefined)
      return cachedEntry;

    return this.getFromDatabase(distinctName);
  }

  storeInCache(dbEntry: DbEntry): DbEntry {
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
  put(ctx: Context, ...dbEntries: DbEntry[]): Promise<DbEntry[]> {
    return this.database.put(ctx, ...dbEntries.map(dbEntry=>this.storeInCache(dbEntry)));
  }

  // returns a promise containing list of dbEntries
  getByIndex(category: Category | DbRef, indexName: string, filterFunc: (x: DbEntry)=>boolean = x=>true): Promise<Category[]> {
    return DbRef.toPromise(this, category).then(cat=>
      this.database.readCategoryIndex(cat as Category, indexName).then(index=>{
        const cachedResults: Category[] = index.map(hash=>this.cacheByHash.get(hash)).filter(dbEntry=>dbEntry && filterFunc(dbEntry)!) as Category[];
        if (cachedResults.length == index.length)
          return Promise.resolve(cachedResults);
      
        const unloadedHashs = index.filter(hash=>!this.cacheByHash.has(hash));
    
        return wp.addJob(unloadedHashs, hash=>this.database.getByHash(hash).then(dbEntry=>(dbEntry && filterFunc(dbEntry)) ? this.storeInCache(dbEntry) : null))
          .then(results=>cachedResults.concat(results.filter((obj: Category)=>!!obj)));
      })
    );
  }
}

