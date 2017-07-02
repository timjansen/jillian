'use strict';

const WorkerPool = require('./workerpool.js');
const DbRef = require('./dbref.js');

class DatabaseSession {

  constructor(database) {
    this.database = database;
    this.cacheByName = {};  // distinct name -> entry
    this.sessionCache = {}; // hash code -> entry
  }

  // returns the entry, null if it does not exist, undefined if not in cache
  getFromCache(distinctName) {
    return this.cacheByName[distinctName];
  }

  getFromDatabase(distinctName) {
      return this.database.get(distinctName)
    .then(dbEntry => this.cacheByName[distinctName] = this.sessionCache[dbEntry.hashCode] = dbEntry);
  }
  
  // return either a value or a Promise!
  get(distinctName) {
    const cachedEntry = this.getFromCache(distinctName);
    if (cachedEntry !== undefined)
      return cachedEntry;

    return this.getFromDatabase(distinctName);
  }
  
  storeInCache(dbEntry) {
    this.cacheByName[dbEntry.distinctName] = dbEntry;
    this.sessionCache[dbEntry.hashCode] = dbEntry;
    return dbEntry;
  }
  
  // for debugging
  clearCacheInternal() {
    this.cacheByName = {}; 
    this.sessionCache = {};
  }
  
  // returns promise
  put(...dbEntries) {
    return this.database.put(...dbEntries.map(dbEntry=>this.storeInCache(dbEntry)));
  }


  // returns a promise containing list of dbEntries
  getOfIndex(category, indexName, filterFunc = x=>true) {
    const index = this.database.readCategoryIndex(category, indexName);
    const cashedResults = index.map(hash=>this.sessionCache[hash]).filter(dbEntry=>dbEntry && filterFunc(dbEntry));
    const unloadedHashs = index.filter(hash=>this.sessionCache[hash] === undefined);
    const pool = new WorkerPool(hash=>this.database.getByHash(hash).then(dbEntry=>filterFunc(dbEntry) ? this.storeInCache(dbEntry) : null));

    pool.addTasks(unloadedHashs);
    return new Promise((fulfilled, rejected)=> {
      pool.registerCompletionHandler((results, errors)=>{
        if (errors.length)
          rejected(errors);
        else 
          fulfilled(cashedResults.concat(results.filter(obj=>!!obj)));
      });
    });
  }
}


module.exports = DatabaseSession;
