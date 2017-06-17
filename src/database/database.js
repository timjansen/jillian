'use strict';

const DbEntry = require('./dbentry.js');
const DatabaseConfig = require('./databaseconfig.js');
const JEL = require('../jel/jel.js');
const JelType = require('../jel/type.js');
const databaseContext = require('./databasecontext.js');
const serializer = require('../jel/serializer.js');
const tifu = require('tifuhash');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = '/dbconfig.jel';
const DATA_DIR = '/data/';

class Database {

  Database(dbPath) {
    this.dbPath = dbPath;
    this.config = null;
  }
  
  /**
   * Loads the database if not already loaded.
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
    try {
      const entryTxt = fs.readFileSync(path, {encoding: 'utf8'});
      try {
        return JEL.execute(entryTxt, databaseContext);
      }
      catch (e) {
        if (e.code === 'ENOENT')
          return undefined;
        throw new Error(`Can not parse database entry ${distinctName} at ${path}: ${e.toString()}`);
      }
    }
    catch (e) {
       throw new Error(`Can not read database entry ${distinctName} at ${path}: ${e.toString()}`);
    }
  }
  
  getSync(distinctName) {
    this.init();
    return this.readEntryInternal(this.getFilePathInternal(distinctName));
  }

  exists(distinctName) {
    this.init();
    return fs.existsSync(this.getFilePathInternal(distinctName));
  }
  
  putSync(dbEntry) {
    this.init();
    const distinctName = dbEntry.distinctName;
    const path = this.getFilePathForHashInternal(dbEntry.hashCode);
    const oldEntry = fs.existsSync(path);
    try {
      fs.writeFileSync(path, serializer.serialize(dbEntry), {encoding: 'utf8'});
    }
    catch (e) {
       throw new Error(`Can not write database entry ${distinctName} at ${path}: ${e.toString()}`);
    }

    if (!oldEntry)
      this.addIndexingInternal(dbEntry);
  }

  deleteSync(dbEntry) {
    this.init();
    const path = this.getFilePathForHashInternal(dbEntry.hashCode);
    
    this.removeIndexingInternal(dbEntry);
    fs.unlinkSync(path);
  }
  
  addIndexingInternal(dbEntry) {
    const spec = dbEntry.databaseIndices();
    for (let name in spec) {
      const indexDesc = spec[name];
      if (indexDesc.type == 'category')
        this.appendToCategoryIndexInternal(JelType.member(dbEntry, indexDesc.property), dbEntry, '_' + name, !!indexDesc.includeParents);
      else
        throw new Error(`Unsupported index type ${indexDesc.type} for index ${name}. Only 'category' is supported for now.`);
    }
  }
  
  removeIndexingInternal(dbEntry) {
    const spec = dbEntry.databaseIndices();
    for (let name in spec) {
      const indexDesc = spec[name];
      if (indexDesc.type == 'category')
        this.removeFromCategoryIndexInternal(JelType.member(dbEntry, indexDesc.property), dbEntry, '_' + name, !!indexDesc.includeParents);
    }
  }
  
  appendToCategoryIndexInternal(dbEntry, category, indexSuffix, recursive) {
    fs.appendFileSync(this.getFilePathForHashInternal(category.hashCode, indexSuffix), dbEntry.hashCode + '\n');
    if (recursive && category.superCategory)
      this.appendToCategoryIndexInternal(dbEntry, category.superCategory, indexSuffix, recursive);
  }
  
  removeFromCategoryIndexInternal(dbEntry, category, indexSuffix, recursive) {
    const fileName = this.getFilePathForHashInternal(category.hashCode, indexSuffix);
    const file = fs.readFileSync(fileName);
    fs.writeFileSync(fileName, file.replace(RegExp('^'+dbEntry.hashCode+'\n'), ''));
    if (recursive && category.superCategory)
      this.removeFromCategoryIndexInternal(dbEntry, category.superCategory, indexSuffix, recursive);
  }
  
  /**
   */
  static create(path, config) {
    // TODO: create
    return new Database(path);
  }
  
}


module.exports = Database;
