'use strict';

const WorkerPool = require('./workerpool.js');
const DbRef = require('./dbref.js');

const wp = new WorkerPool();

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
    .then(dbEntry => this.storeInCache(dbEntry));
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
    return this;
  }
  
  // returns promise
  put(...dbEntries) {
    return this.database.put(...dbEntries.map(dbEntry=>this.storeInCache(dbEntry)));
  }

  // returns a promise containing list of dbEntries
  getByIndex(category, indexName, filterFunc = x=>true) {
    return DbRef.toPromise(this, category).then(cat=>
      this.database.readCategoryIndex(cat, indexName).then(index=>{
        const cachedResults = index.map(hash=>this.sessionCache[hash]).filter(dbEntry=>dbEntry && filterFunc(dbEntry));
        if (cachedResults.length == index.length)
          return Promise.resolve(cachedResults);
      
        const unloadedHashs = index.filter(hash=>this.sessionCache[hash] === undefined);
    
        return wp.addJob(unloadedHashs, hash=>this.database.getByHash(hash).then(dbEntry=>filterFunc(dbEntry) ? this.storeInCache(dbEntry) : null))
          .then(results=>cachedResults.concat(results.filter(obj=>!!obj)));
      })
    );
  }
  


}


module.exports = DatabaseSession;
