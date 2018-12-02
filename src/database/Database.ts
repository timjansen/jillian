import DbEntry from './DbEntry';
import DbRef from './DbRef';
import DatabaseConfig from './DatabaseConfig';
import DatabaseError from './DatabaseError';
import NotFoundError from './NotFoundError';
import DatabaseContext from './DatabaseContext';
import DbIndexDescriptor from './DbIndexDescriptor';
import WorkerPool from './WorkerPool';
import Category from './dbObjects/Category';
import Package from './dbObjects/Package';
import DatabaseType from './dbObjects/DatabaseType';


import JEL from '../jel/JEL';
import Context from '../jel/Context';
import DefaultContext from '../jel/DefaultContext';
import NativeTypeDefinition from '../jel/NativeTypeDefinition';
import List from '../jel/types/List';
import Runtime from '../jel/Runtime';
import serializer from '../jel/Serializer';

import tifu = require('tifuhash');

import * as fs from 'fs-extra';
import * as path from 'path';

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
    .then(configTxt=>JEL.execute(configTxt, DefaultContext.plus({DatabaseConfig: new NativeTypeDefinition(DatabaseConfig)}))
            .catch(e=>DatabaseError.rethrow(`Can not open database. Failed to load configuration "${CONFIG_FILE}" in "${this.dbPath}".`, e)))
    .then(config=>{
          this.config = config;
          return config;
    });
    
    return this.config.then(config=>f(config));
  }
  
  private getFilePathForHash(config: DatabaseConfig, hash: string, suffix = '.jel'): string {
    function dirPart(end: number, idx=0): string { return idx < end ? hash.substr(idx*2, 2) + '/' + dirPart(end, idx+1) : ''}
    return path.join(this.dbPath, dirPart(config.directoryDepth) +  hash + suffix);
  }

  private getFilePath(config: DatabaseConfig, distinctName: string, suffix = '.jel'): string {
    return this.getFilePathForHash(config, tifu.hash(distinctName));
  }
  
  private readEntry(ctx: Context, distinctName: string, path: string): Promise<DbEntry | null> {
    return fs.readFile(path, {encoding: 'utf8'})
    .then(entryTxt=>JEL.execute(entryTxt, ctx))
    .catch(e=> {
      if (e.code == 'ENOENT')
        return null;
      DatabaseError.rethrow(`Can not read database entry ${distinctName} at ${path}`, e);
    });
  }
 
  getIfFound(ctx: Context, distinctName: string): Promise<DbEntry|null> {
    return this.init(config=>this.readEntry(ctx, distinctName, this.getFilePath(config, distinctName)));
  }

  get(ctx: Context, distinctName: string): Promise<DbEntry> {
    return this.getIfFound(ctx, distinctName)
							 .then(p=>(p || Promise.reject(new NotFoundError(distinctName))) as any);
  }
	
  getByHash(ctx: Context, hash: string): Promise<DbEntry> {
    return this.init(config=>this.readEntry(ctx, hash, this.getFilePathForHash(config, hash))
							 .then(p=>(p || Promise.reject(new NotFoundError(hash))) as any));
  }

  exists(distinctName: string): Promise<boolean> {
    return this.init(config=>fs.pathExists(this.getFilePath(config, distinctName)));
  }
  
  put(ctx: Context, ...dbEntries: DbEntry[]): Promise<never> {
    return this.init(config=>WorkerPool.run(dbEntries, dbEntry=>{
      const distinctName = dbEntry.distinctName;
      const p = this.getFilePathForHash(config, dbEntry.hashCode);
      return fs.ensureDir(path.dirname(p))
      .then(()=>fs.pathExists(p))
      .then(oldEntryExists=>
         fs.writeFile(p, serializer.serialize(dbEntry), {encoding: 'utf8'})
        .then(()=>{
          if (!oldEntryExists)
            return this.addIndexing(ctx, config, dbEntry);
        }))
      .catch (e=>DatabaseError.rethrow(`Can not write database entry ${distinctName} at ${p}`, e));
    }));
  }

  delete(ctx: Context, dbEntry: DbEntry): Promise<any> {
    return this.init(config=>{
      const path = this.getFilePathForHash(config, dbEntry.hashCode);

      return this.removeIndexing(ctx, config, dbEntry).then(()=>fs.unlink(path));
    });
  }

  
  private addIndexing(ctx: Context, config: DatabaseConfig, dbEntry: DbEntry): Promise<any> {
    const spec: Map<string, DbIndexDescriptor> = dbEntry.databaseIndices;
    const indexPromises: Promise<any>[] = [];
    spec.forEach((indexDesc, name)=>{
      if (indexDesc.type == 'category') {
        const cat: DbRef = Runtime.member(ctx, dbEntry, indexDesc.property) as any;
        if (cat)
          indexPromises.push(Promise.resolve(cat.getFromDb(ctx)).then(catRef=>catRef && this.appendToCategoryIndex(ctx, config, dbEntry, catRef as Category, '_' + name, !!indexDesc.includeParents)));
      }
      else
        throw new DatabaseError(`Unsupported index type ${indexDesc.type} for index ${name}. Only 'category' is supported for now.`);
    });
    return Promise.all(indexPromises);
  }
  
  private removeIndexing(ctx: Context, config: DatabaseConfig, dbEntry: DbEntry): Promise<any> {
    const spec: Map<string, DbIndexDescriptor> = dbEntry.databaseIndices;
    const indexPromises: Promise<any>[] = [];
    spec.forEach((indexDesc, name)=>{
      if (indexDesc.type == 'category') {
        const cat: DbRef = Runtime.member(ctx, dbEntry, indexDesc.property) as any;
        if (cat)
          indexPromises.push(Promise.resolve(cat.getFromDb(ctx)).then(catRef=>catRef && this.removeFromCategoryIndex(ctx, config, dbEntry, catRef as Category, '_' + name, !!indexDesc.includeParents)));
      }
    });
    return Promise.all(indexPromises);
  }
  
  private appendToCategoryIndex(ctx: Context, config: DatabaseConfig, dbEntry: DbEntry, category: Category, indexSuffix: string, recursive: boolean): Promise<any> {
    const indexPath = this.getFilePathForHash(config, category.hashCode, indexSuffix);
    const prom = fs.appendFile(indexPath, dbEntry.hashCode + '\n');
    if (recursive && category.superCategory)
      return prom.then(()=>Promise.resolve(category.superCategory!.getFromDb(ctx) as Category).then(superCat=>superCat && this.appendToCategoryIndex(ctx, config, dbEntry, superCat, indexSuffix, recursive)));
    else
      return prom;
  }
  
  private removeFromCategoryIndex(ctx: Context, config: DatabaseConfig, dbEntry: DbEntry, category: Category, indexSuffix: string, recursive: boolean): Promise<any> {
    const indexPath = this.getFilePathForHash(config, category.hashCode, indexSuffix);
    const prom = fs.readFile(indexPath)
    .then(file=>fs.writeFile(indexPath, file.toString().replace(RegExp('^'+dbEntry.hashCode+'\n'), '')));
    if (recursive && category.superCategory)
      return prom.then(()=>Promise.resolve(category.superCategory!.getFromDb(ctx) as Category).then(superCat=>superCat && this.removeFromCategoryIndex(ctx, config, dbEntry, superCat, indexSuffix, recursive)));
    else
      return prom;
  }
  
  // returns a promise of a hash array
  readCategoryIndex(category: Category, indexName: string): Promise<string[]> {
    return this.init(config=>{
      const indexPath = this.getFilePathForHash(config, category.hashCode, '_' + indexName);
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
	
	/**
	 * Loads all .jel files from a directory and stores them in the database. 
	 * Each .jel file must contain one complete DbEntry. Categories must end with 'Category.jel' so they can be loaded first.
	 * Files without .jel extension are ignored.
	 * @param dirPath the path of the directory to load
	 * @param recursive if true, loadDir() will load data from subdirectories
	 * @return a Promise with the number of loaded objects, or a DatabaseError
	 */
	loadDir(ctx: Context, dirPath: string, recursive = true): Promise<number> {
		const pool = new WorkerPool();
		const db = this;
		return db.init(config=>{

			// returns Promise of [categoryFiles, entryFiles, dirs] for a single directory
			function getPaths(dir: string): Promise<string[][]> {
				return (fs as any).readdir(dir, {withFileTypes: true}) // TODO: remove any when new readdir signature available
				.then((files: any[])=>files.map(stat=>[stat.name, stat.name.endsWith('.jel') && stat.isFile(), stat.name.endsWith('Category.jel'), stat.isDirectory()] as any)) // TODO: replace any->fs.Dirent when available
				.then((r: any)=>[r.filter((a: any)=>a[1] && a[2]).map((a: any)=>path.join(dir, a[0])), 
									r.filter((a: any)=>a[1] && !a[2]).map((a: any)=>path.join(dir, a[0])),
								  r.filter((a: any)=>a[3]).map((a: any)=>path.join(dir, a[0]))]);
			}

			// returns Promise of [categoryFiles, entryFiles] for recursive dir structure
			function getPathsRecursive(dir: string, recursive: boolean): Promise<string[][]> {
				return getPaths(dir).then(r=> 
					recursive ?
						pool.runJob(r[2], a=>getPathsRecursive(a, true))
							.then(r2=>r2.reduce((a, b)=>[a[0].concat(b[0]), a[1].concat(b[1])], [[], []]))
							.then(r2=>[r[0].concat(r2[0]), r[1].concat(r2[1])])
					: r
				)
				.catch(e=>DatabaseError.rethrow(`Failed to read directory "${dir}"`, e));
			}
			return getPathsRecursive(dirPath, recursive).then(r=> {
				const [categoryFiles, entryFiles] = r;
				return pool.runJobIgnoreNull(categoryFiles, file=>db.readEntry(ctx, file.replace(/^.*\/|\.jel$/g, ''), file) as Promise<Category | null>)
					.then(categories=> {
						const providedCats = new Set<string>(categories.map(c=>c.distinctName));
						const availableCats = new Set<string>(); // set of distinct names

						const MAX_ITERATIONS = 10;
						function loadCategories(catsToDo: Category[], iterationsLeft: number): Promise<void> {
							const readyCats = catsToDo.filter(c=>!c.superCategory || availableCats.has(c.superCategory.distinctName));
							const futureCats = catsToDo.filter(c=>c.superCategory && providedCats.has(c.superCategory.distinctName) && !availableCats.has(c.superCategory.distinctName));
							const undecidedCats = catsToDo.filter(c=>c.superCategory && !availableCats.has(c.superCategory.distinctName) && !providedCats.has(c.superCategory.distinctName));
							return pool.runJob(undecidedCats, c=>db.exists(c.superCategory!.distinctName)
																				.then(e=>(e ? c : Promise.reject(new DatabaseError(`There is no definition for Category ${c.superCategory!.distinctName}" required as superCategory for ${c.distinctName}`)) as any)))
								.then((checkedCats: Category[])=> {
									checkedCats.forEach(c=>availableCats.add(c.distinctName));
									return db.put(ctx, ...readyCats.concat(checkedCats))
										.then(()=>{
					            readyCats.forEach(c=>availableCats.add(c.distinctName));
                      return !futureCats.length ? Promise.resolve() : 
													iterationsLeft>0 ? loadCategories(futureCats, iterationsLeft-1) : 
													Promise.reject(new DatabaseError(`Can not load categories after ${MAX_ITERATIONS} iterations. There appears to be a loop in superCategory relations.\nMissing categories: ${futureCats.slice(0,100).map(a=>a.distinctName).join(' ,')}`))
                  });
								});
						}

						return loadCategories(categories, MAX_ITERATIONS).then(()=>{
              const packagesContent: DatabaseType[] = [];
							return pool.runJobIgnoreNull(entryFiles, file=>db.readEntry(ctx, file.replace(/^.*\/|\.jel$/g, ''), file)
												 							        .then(entry=> {
                if (entry instanceof DatabaseType) 
                  packagesContent.push(entry);
                return db.put(ctx, entry as DbEntry);
              }))
              .then(()=> {
                const typeByPackage = new Map<string, DatabaseType[]>();
                packagesContent.filter(pc=>pc.package.includes('::'))
                  .forEach(pc=>typeByPackage.has(pc.package)?typeByPackage.get(pc.package)!.push(pc):typeByPackage.set(pc.package, [pc]));
                return pool.runJob(Array.from(typeByPackage.keys()), pkg=>db.exists(pkg).then(e=>e as any|| db.put(ctx, new Package(pkg, new List(typeByPackage.get(pkg) as any)))));
              });
            });
					})
					.then(()=>categoryFiles.length + entryFiles.length);
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

