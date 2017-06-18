'use strict';

const DbEntry = require('./dbentry.js');
const DatabaseConfig = require('./databaseconfig.js');
const JEL = require('../jel/jel.js');
const JelType = require('../jel/type.js');
const databaseContext = require('./databasecontext.js');
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
   * Loads the database if not already loaded. All public methods need to call this first,
   */
  init() {
    if (this.config)
      return this.config;
    if (!fs.statSync().isDirectory())
      throw new Error(`Can not open database. Path "${this.path}" is not a directory or can not be accessed.`);
    if (!fs.statSync().isDirectory())
      throw new Error(`Can not open database. Missing data directory "${DATA_DIR}" in "${this.path}".`);

    
    try {
      const configTxt = fs.readFileSync(path.join(this.dbPath, CONFIG_FILE), {encoding: 'utf8'});
    
      try {
        this.config = JEL.execute(configTxt, {DatabaseConfig});
        this.directoryDepth = Math.floor(Math.log(config.sizing) / Math.log(256));
      }
      catch (e) {
        throw new Error(`Can not parse configuration "${CONFIG_FILE}" in "${this.path}": ${e.toString()}`);
      }
    }
    catch(e) {
      throw new Error(`Can not open database. Can not load configuration "${CONFIG_FILE}" in "${this.path}".`);
    }
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
    .then(entryTxt=>JEL.execute(entryTxt, databaseContext))
    .catch(e=> {
      if (e.code == 'ENOENT')
        return null;
      throw new Error(`Can not read database entry ${distinctName} at ${path}: ${e.toString()}`);
    });
  }
  
  get(distinctName) {
    this.init();
    return this.readEntryInternal(this.getFilePathInternal(distinctName));
  }

  exists(distinctName) {
    this.init();
    return fs.exists(this.getFilePathInternal(distinctName));
  }
  
  put(dbEntry) {
    this.init();
    const distinctName = dbEntry.distinctName;
    const path = this.getFilePathForHashInternal(dbEntry.hashCode);
    return fs.exists(path)
    .then(oldEntry=>
       fs.writeFile(path, serializer.serialize(dbEntry), {encoding: 'utf8'})
      .then(()=>{
        if (!oldEntry)
          return this.addIndexingInternal(dbEntry);
      }))
    .catch (e=>new Error(`Can not write database entry ${distinctName} at ${path}: ${e.toString()}`));
  }

  delete(dbEntry) {
    this.init();
    const path = this.getFilePathForHashInternal(dbEntry.hashCode);
    
    return this.removeIndexingInternal(dbEntry).then(()=>fs.unlink(path));
  }
  
  addIndexingInternal(dbEntry) {
    const spec = dbEntry.databaseIndices();
    const indexPromises = [];
    for (let name in spec) {
      const indexDesc = spec[name];
      if (indexDesc.type == 'category')
        indexPromises.push(this.appendToCategoryIndexInternal(JelType.member(dbEntry, indexDesc.property), dbEntry, '_' + name, !!indexDesc.includeParents));
      else
        throw new Error(`Unsupported index type ${indexDesc.type} for index ${name}. Only 'category' is supported for now.`);
    }
    return Promise.all(indexPromises);
  }
  
  removeIndexingInternal(dbEntry) {
    const spec = dbEntry.databaseIndices();
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
  
  /**
   */
  static create(path, config) {
    // TODO: create
    return new Database(path);
  }
  
}


module.exports = Database;
