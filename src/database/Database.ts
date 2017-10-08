import DbEntry from './DbEntry';
import DbRef from './DbRef';
import DatabaseConfig from './DatabaseConfig';
import DatabaseError from './DatabaseError';
import DatabaseContext from './DatabaseContext';
import Category from './Category';

import JEL from '../jel/JEL';
import Context from '../jel/Context';
import JelType from '../jel/JelType';
import serializer from '../jel/Serializer';

import tifu = require('tifuhash');

import fs = require('fs-extra');
import path = require('path');

const CONFIG_FILE = '/dbconfig.jel';
const DATA_DIR = '/data/';

export default class Database {
  config: DatabaseConfig | Promise<DatabaseConfig> | undefined; // initialized by init().
  
  constructor(public dbPath: string) {
  }
  
  /**
   * Loads the database if not already loaded. All public methods need to call this first.
   */
  private init(f: (c: DatabaseConfig)=>any) {
    if (this.config instanceof Promise)
      return this.config.then(config=>f(config));
    else if (this.config)
      return f(this.config);
    
    this.config = fs.pathExists(this.dbPath)
      .then(r=>{
        if (!r)
          throw new DatabaseError(`Can not open database. Path "${this.dbPath}" is not a directory or can not be accessed.`);
        return fs.pathExistsSync(path.join(this.dbPath, DATA_DIR));
      })
      .then(r=>{
        if (!r)
          throw new DatabaseError(`Can not open database. Missing data directory "${DATA_DIR}" in "${this.dbPath}".`);
        return fs.readFile(path.join(this.dbPath, CONFIG_FILE), {encoding: 'utf8'})
          .catch(e=>DatabaseError.rethrow(`Can not parse configuration "${CONFIG_FILE}" in "${this.dbPath}": ${e.toString()}`, e));
    })
    .then(configTxt=>JEL.execute(configTxt, new Context().setAll({DatabaseConfig}))
            .catch(e=>DatabaseError.rethrow(`Can not open database. Failed to load configuration "${CONFIG_FILE}" in "${this.dbPath}".`, e)))
    .then(config=>{
          this.config = config;
          return config;
    });
    
    return this.config.then(config=>f(config));
  }
  
  private getFilePathForHashInternal(config: DatabaseConfig, hash: string, suffix = '.jel'): string {
    function dirPart(end: number, idx=0): string { return idx < end ? hash.substr(idx*2, 2) + '/' + dirPart(end, idx+1) : ''}
    return path.join(this.dbPath, dirPart(config.directoryDepth) +  hash + suffix);
  }

  private getFilePathInternal(config: DatabaseConfig, distinctName: string, suffix = '.jel'): string {
    return this.getFilePathForHashInternal(config, tifu.hash(distinctName));
  }
  
  private readEntryInternal(distinctName: string, path: string): Promise<DbEntry | null> {
    return fs.readFile(path, {encoding: 'utf8'})
    .then(entryTxt=>JEL.execute(entryTxt, DatabaseContext.create()))
    .catch(e=> {
      if (e.code == 'ENOENT')
        return null;
      DatabaseError.rethrow(`Can not read database entry ${distinctName} at ${path}`, e);
    });
  }
 
  get(distinctName: string): Promise<DbEntry | null> {
    return this.init(config=>this.readEntryInternal(distinctName, this.getFilePathInternal(config, distinctName)));
  }
  
  getByHash(hash: string): Promise<DbEntry | null> {
    return this.init(config=>this.readEntryInternal(hash, this.getFilePathForHashInternal(config, hash)));
  }

  exists(distinctName: string): Promise<boolean> {
    return this.init(config=>fs.pathExists(this.getFilePathInternal(config, distinctName)));
  }
  
  put(...dbEntries: DbEntry[]): Promise<DbEntry[]> {
    return this.init(config=>Promise.all(dbEntries.map(dbEntry=>{
      const distinctName = dbEntry.distinctName;
      const p = this.getFilePathForHashInternal(config, dbEntry.hashCode);
      return fs.ensureDir(path.dirname(p))
      .then(()=>fs.pathExists(p))
      .then(oldEntryExists=>
         fs.writeFile(p, serializer.serialize(dbEntry), {encoding: 'utf8'})
        .then(()=>{
          if (!oldEntryExists)
            return this.addIndexingInternal(config, dbEntry);
        }))
      .catch (e=>DatabaseError.rethrow(`Can not write database entry ${distinctName} at ${p}`, e));
    })));
  }

  delete(dbEntry: DbEntry): Promise<any> {
    return this.init(config=>{
      const path = this.getFilePathForHashInternal(config, dbEntry.hashCode);

      return this.removeIndexingInternal(config, dbEntry).then(()=>fs.unlink(path));
    });
  }

  
  private addIndexingInternal(config: DatabaseConfig, dbEntry: DbEntry): Promise<any> {
    const spec = dbEntry.databaseIndices;
    const indexPromises = [];
    for (let name in spec) {
      const indexDesc = spec[name];
      if (indexDesc.type == 'category') {
        const cat = JelType.member(dbEntry, indexDesc.property);
        if (cat)
          indexPromises.push(Promise.resolve(cat.getFromDb(this)).then(catRef=>catRef && this.appendToCategoryIndexInternal(config, dbEntry, catRef, '_' + name, !!indexDesc.includeParents)));
      }
      else
        throw new DatabaseError(`Unsupported index type ${indexDesc.type} for index ${name}. Only 'category' is supported for now.`);
    }
    return Promise.all(indexPromises);
  }
  
  private removeIndexingInternal(config: DatabaseConfig, dbEntry: DbEntry): Promise<any> {
    const spec = dbEntry.databaseIndices;
    const indexPromises = [];
    for (let name in spec) {
      const indexDesc = spec[name];
      if (indexDesc.type == 'category') {
        const cat = JelType.member(dbEntry, indexDesc.property);
        if (cat)
          indexPromises.push(Promise.resolve(cat.getFromDb(this)).then(catRef=>catRef && this.removeFromCategoryIndexInternal(config, dbEntry, catRef, '_' + name, !!indexDesc.includeParents)));
      }
    }
    return Promise.all(indexPromises);
  }
  
  private appendToCategoryIndexInternal(config: DatabaseConfig, dbEntry: DbEntry, category: Category, indexSuffix: string, recursive: boolean): Promise<any> {
    const indexPath = this.getFilePathForHashInternal(config, category.hashCode, indexSuffix);
    const prom = fs.appendFile(indexPath, dbEntry.hashCode + '\n');
    if (recursive && category.superCategory)
      return prom.then(()=>Promise.resolve(category.superCategory.getFromDb(this) as Category).then(superCat=>superCat && this.appendToCategoryIndexInternal(config, dbEntry, superCat, indexSuffix, recursive)));
    else
      return prom;
  }
  
  private removeFromCategoryIndexInternal(config: DatabaseConfig, dbEntry: DbEntry, category: Category, indexSuffix: string, recursive: boolean): Promise<any> {
    const indexPath = this.getFilePathForHashInternal(config, category.hashCode, indexSuffix);
    const prom = fs.readFile(indexPath)
    .then(file=>fs.writeFile(indexPath, file.toString().replace(RegExp('^'+dbEntry.hashCode+'\n'), '')));
    if (recursive && category.superCategory)
      return prom.then(()=>Promise.resolve(category.superCategory.getFromDb(this) as Category).then(superCat=>superCat && this.removeFromCategoryIndexInternal(config, dbEntry, superCat, indexSuffix, recursive)));
    else
      return prom;
  }
  
  // returns a promise of a hash array
  readCategoryIndex(category: Category, indexName: string): Promise<any> {
    return this.init(config=>{
      const indexPath = this.getFilePathForHashInternal(config, category.hashCode, '_' + indexName);
      return fs.readFile(indexPath)
        .then(data=>data.toString().split('\n').filter(s=>!!s))
        .catch(e=> {
          if (e.code == 'ENOENT')
            return [];
          else
            DatabaseError.rethrow(`Failed to read index file ${indexPath}`, e);
        });
    });
  }
 
  // returns promise
  static create(dbPath: string, config = new DatabaseConfig()): Promise<Database> {
    if (fs.pathExistsSync(dbPath))
      throw new DatabaseError(`Can not create database, "${dbPath}" already exists`);

    try {
      fs.mkdirpSync(path.join(dbPath, DATA_DIR));
      fs.writeFileSync(path.join(dbPath, CONFIG_FILE), serializer.serialize(config), {encoding: 'utf8'});
    }
    catch(e) {
      throw new DatabaseError(`Can not create database at "${dbPath}": ${e}`, e);
    }

    return new Promise(resolve=>resolve(new Database(dbPath))); // even though the impl is sync, return async for future compatibility
  }
  
}

