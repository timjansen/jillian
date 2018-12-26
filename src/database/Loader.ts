import DbEntry from './DbEntry';
import DbRef from './DbRef';
import DatabaseConfig from './DatabaseConfig';
import DatabaseError from './DatabaseError';
import NotFoundError from './NotFoundError';
import DatabaseContext from './DatabaseContext';
import Database from './Database';
import DbSession from './DbSession';
import WorkerPool from './WorkerPool';
import Category from './dbObjects/Category';
import Package from '../jel/types/Package';
import PackageContent from '../jel/types/PackageContent';
import NamedObject from '../jel/NamedObject';

import JEL from '../jel/JEL';
import Context from '../jel/Context';
import List from '../jel/types/List';
import serializer from '../jel/Serializer';

import * as fs from 'fs-extra';
import * as path from 'path';


export default class Loader {
  
	/**
	 * Executes a database bootstrap load from the given directory. It will 
	 * call Database.loadDir() recursively for each subdirectory in the given directory, in alphabetical order and only one directory at a time.
	 * @param database the database to load into
	 * @param dirPath the location of the load directory
	 * @param logFunction an optional function to log the progress to. Can be console.log.
	 * @return a Promise that returns the number of loaded objects
	 */ 
	static bootstrapDatabaseObjects(database: Database, dirPath: string, logFunction?: (...args: any[])=>void): Promise<number> {
    const session = new DbSession(database);
		let objectCount = 0, dirCount = 0;
		if (logFunction)
			logFunction(`Start bootstrapping database at ${database.dbPath} from ${dirPath}`);
		
		return (fs as any).readdir(dirPath, {withFileTypes: true}) // TODO: remove any cast when new readdir() signature is in fs-extra
			.then((files: any[]) => {  // TODO: use fs.Dirent as type here when available for TypeScript
				const dirs: string[] = files.filter(s=>s.isDirectory()).map(s=>s.name).sort();
				dirCount = dirs.length;
				return WorkerPool.run(dirs, (dir: string)=>{
					const fullDir = path.join(dirPath, dir);
					if (logFunction)
						logFunction("Loading database directory " + fullDir); 
					return Loader.loadDir(session.ctx, fullDir).then(c=>objectCount+=c);
				}, 1);
			})
			.then(()=>{
				if(logFunction)
					logFunction(`Bootstrap finished. Successfully loaded ${objectCount} objects from ${dirCount} directories.`);
				return objectCount;
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
	static loadDir(ctx: Context, dirPath: string, recursive = true): Promise<number> {
    const db = (ctx.dbSession as any).database;
		const pool = new WorkerPool();
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
                                      .then((e: any)=>(e ? c : Promise.reject(new DatabaseError(`There is no definition for Category ${c.superCategory!.distinctName}" required as superCategory for ${c.distinctName}`)) as any)))
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
            const packagesContent: PackageContent[] = [];
            return pool.runJobIgnoreNull(entryFiles, file=>db.readEntry(ctx, file.replace(/^.*\/|\.jel$/g, ''), file)
                                            .then((entry: NamedObject)=> {
              if (entry instanceof PackageContent) 
                packagesContent.push(entry);
              return db.put(ctx, entry as NamedObject);
            }))
            .then(()=> {
              const typeByPackage = new Map<string, PackageContent[]>();
              packagesContent.filter(pc=>pc.packageName.includes('::'))
                .forEach(pc=>typeByPackage.has(pc.packageName)?typeByPackage.get(pc.packageName)!.push(pc):typeByPackage.set(pc.packageName, [pc]));
              return pool.runJob(Array.from(typeByPackage.keys()), pkg=>db.exists(pkg).then((e: any)=>e || db.put(ctx, new Package(pkg, new List(typeByPackage.get(pkg) as any)))));
            });
          });
        })
        .then(()=>categoryFiles.length + entryFiles.length);
    });
	}

	
}

