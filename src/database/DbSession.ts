import WorkerPool from './WorkerPool';
import Category from './Category';
import DbRef from './DbRef';
import DbEntry from './DbEntry';
import Database from './Database';

const wp = new WorkerPool();

export default class DbSession {
  cacheByName = {};  // distinct name -> entry; stores null for entries that have not been found. Undefined means never requested.
  sessionCache = {}; // hash code -> entry
  
  constructor(public database: Database) {
  }

  // returns the entry, null if it does not exist, undefined if not in cache
  getFromCache(distinctName: string): DbEntry | null | undefined {
    return this.cacheByName[distinctName];
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
    this.cacheByName[dbEntry.distinctName] = dbEntry;
    this.sessionCache[dbEntry.hashCode] = dbEntry;
    return dbEntry;
  }
  
  // for debugging
  clearCacheInternal(): DbSession {
    this.cacheByName = {}; 
    this.sessionCache = {};
    return this;
  }
  
  // returns promise
  put(...dbEntries: DbEntry[]): Promise<DbEntry[]> {
    return this.database.put(...dbEntries.map(dbEntry=>this.storeInCache(dbEntry)));
  }

  // returns a promise containing list of dbEntries
  getByIndex(category: Category | DbRef, indexName: string, filterFunc: (x: DbEntry)=>boolean = x=>true): Promise<Category[]> {
    return DbRef.toPromise(this, category).then(cat=>
      this.database.readCategoryIndex(cat as Category, indexName).then(index=>{
        const cachedResults = index.map(hash=>this.sessionCache[hash]).filter(dbEntry=>dbEntry && filterFunc(dbEntry));
        if (cachedResults.length == index.length)
          return Promise.resolve(cachedResults);
      
        const unloadedHashs = index.filter(hash=>this.sessionCache[hash] === undefined);
    
        return wp.addJob(unloadedHashs, hash=>this.database.getByHash(hash).then(dbEntry=>(dbEntry && filterFunc(dbEntry)) ? this.storeInCache(dbEntry) : null))
          .then(results=>cachedResults.concat(results.filter(obj=>!!obj)));
      })
    );
  }
}

