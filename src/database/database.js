'use strict';

const Utils = require('../util/utils.js');
const DbEntry = require('./dbentry.js');
const DatabaseConfig = require('./databaseconfig.js');
const DatabaseError = require('./databaseerror.js');
const DatabaseSession = require('./databasesession.js');
const DatabaseContext = require('./databasecontext.js');

const JEL = require('../jel/jel.js');
const JelType = require('../jel/type.js');
const serializer = require('../jel/serializer.js');

const tifu = require('tifuhash');

const fs = require('fs-extra');
const path = require('path');

const CONFIG_FILE = '/dbconfig.jel';
const DATA_DIR = '/data/';

class Database {

  constructor(dbPath) {
    this.dbPath = dbPath;
    this.config = null; // initialized by init().
  }
  
  /**
   * Loads the database if not already loaded. All public methods need to call this first.
   */
  init(f) {
    if (this.config instanceof Promise)
      return this.config.then(config=>f(config));
    else if (this.config)
      return f(this.config);
    
    this.config = fs.exists(this.dbPath)
      .then(r=>{
        if (!r)
          throw new DatabaseError(`Can not open database. Path "${this.dbPath}" is not a directory or can not be accessed.`);
        return fs.existsSync(path.join(this.dbPath, DATA_DIR));
      })
      .then(r=>{
        if (!r)
          throw new DatabaseError(`Can not open database. Missing data directory "${DATA_DIR}" in "${this.dbPath}".`);
        return fs.readFile(path.join(this.dbPath, CONFIG_FILE), {encoding: 'utf8'})
          .catch(e=>DatabaseError.rethrow(e, `Can not parse configuration "${CONFIG_FILE}" in "${this.dbPath}": ${e.toString()}`));
    })
    .then(configTxt=>JEL.execute(configTxt, {DatabaseConfig})
            .catch(e=>DatabaseError.rethrow(e, `Can not open database. Failed to load configuration "${CONFIG_FILE}" in "${this.dbPath}".`)))
    .then(config=>{
          this.config = config;
          this.directoryDepth = Math.floor(Math.log(config.sizing) / Math.log(256));
          return config;
    });
    
    return this.config.then(config=>f(config));
  }
  
  getFilePathForHashInternal(hash, suffix = '.jel') {
    function dirPart(end, idx=0) { return idx < end ? hash.substr(idx*2, 2) + '/' + dirPart(end, idx+1) : ''}
    return path.join(this.dbPath, dirPart(this.directoryDepth) +  hash + suffix);
  }

  getFilePathInternal(distinctName, suffix = '.jel') {
    return this.getFilePathForHashInternal(tifu.hash(distinctName));
  }
  
  readEntryInternal(distinctName, path) {
    return fs.readFile(path, {encoding: 'utf8'})
    .then(entryTxt=>JEL.execute(entryTxt, DatabaseContext.create(new DatabaseSession(this))))
    .catch(e=> {
      if (e.code == 'ENOENT')
        return null;
      DatabaseError.rethrow(e, `Can not read database entry ${distinctName} at ${path}`);
    });
  }
 
  get(distinctName) {
    return this.init(config=>this.readEntryInternal(distinctName, this.getFilePathInternal(distinctName)));
  }
  
  getByHash(hash) {
    return this.init(config=>this.readEntryInternal(hash, this.getFilePathForHashInternal(hash)));
  }

  exists(distinctName) {
    return this.init(config=>fs.exists(this.getFilePathInternal(distinctName)));
  }
  
  put(...dbEntries) {
    return this.init(config=>Promise.all(dbEntries.map(dbEntry=>{
      const distinctName = dbEntry.distinctName;
      const p = this.getFilePathForHashInternal(dbEntry.hashCode);
      return fs.ensureDir(path.dirname(p))
      .then(()=>fs.exists(p))
      .then(oldEntryExists=>
         fs.writeFile(p, serializer.serialize(dbEntry), {encoding: 'utf8'})
        .then(()=>{
          if (!oldEntryExists)
            return this.addIndexingInternal(dbEntry);
        }))
      .catch (e=>DatabaseError.rethrow(e, `Can not write database entry ${distinctName} at ${p}`));
    })));
  }

  delete(dbEntry) {
    return this.init(config=>{
      const path = this.getFilePathForHashInternal(dbEntry.hashCode);

      return this.removeIndexingInternal(dbEntry).then(()=>fs.unlink(path));
    });
  }
  
  addIndexingInternal(dbEntry) {
    const spec = dbEntry.databaseIndices;
    const indexPromises = [];
    for (let name in spec) {
      const indexDesc = spec[name];
      if (indexDesc.type == 'category')
        indexPromises.push(this.appendToCategoryIndexInternal(JelType.member(dbEntry, indexDesc.property), dbEntry, '_' + name, !!indexDesc.includeParents));
      else
        throw new DatabaseError(`Unsupported index type ${indexDesc.type} for index ${name}. Only 'category' is supported for now.`);
    }
    return Promise.all(indexPromises);
  }
  
  removeIndexingInternal(dbEntry) {
    const spec = dbEntry.databaseIndices;
    const indexPromises = [];
    for (let name in spec) {
      const indexDesc = spec[name];
      if (indexDesc.type == 'category')
        indexPromises.push(this.removeFromCategoryIndexInternal(JelType.member(dbEntry, indexDesc.property), dbEntry, '_' + name, !!indexDesc.includeParents));
    }
    return Promise.all(indexPromises);
  }
  
  appendToCategoryIndexInternal(dbEntry, category, indexSuffix, recursive) {
    const prom = fs.appendFile(this.getFilePathForHashInternal(category.hashCode, indexSuffix), dbEntry.hashCode + '\n');
    if (recursive && category.superCategory)
      return prom.then(p=>this.appendToCategoryIndexInternal(dbEntry, category.superCategory, indexSuffix, recursive));
    else
      return prom;
  }
  
  removeFromCategoryIndexInternal(dbEntry, category, indexSuffix, recursive) {
    const fileName = this.getFilePathForHashInternal(category.hashCode, indexSuffix);
    const prom = fs.readFile(fileName)
    .then(file=>fs.writeFile(fileName, file.replace(RegExp('^'+dbEntry.hashCode+'\n'), '')));
    if (recursive && category.superCategory)
      return prom.then(p=>this.removeFromCategoryIndexInternal(dbEntry, category.superCategory, indexSuffix, recursive));
    else
      return prom;
  }
  
  // returns a promise of a hash array
  readCategoryIndex(category, indexName) {
    return this.init(config=>{
      const fileName = this.getFilePathForHashInternal(category.hashCode, '_' + indexName);
      return fs.readFile(fileName)
        .then(data=>data.split('\n'));
    });
  }
 
  // returns promise
  static create(dbPath, config = new DatabaseConfig()) {
    if (fs.existsSync(dbPath))
      throw new DatabaseError(`Can not create database, "${dbPath}" already exists`);

    try {
      fs.mkdirpSync(path.join(dbPath, DATA_DIR));
      fs.writeFileSync(path.join(dbPath, CONFIG_FILE), serializer.serialize(config), {encoding: 'utf8'});
    }
    catch(e) {
      throw new DatabaseError(e, `Can not create database at "${dbPath}": ${e}`);
    }

    return new Promise(resolve=>resolve(new Database(dbPath))); // even though the impl is sync, return async for future compatibility
  }
  
}


module.exports = Database;
