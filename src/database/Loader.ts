import DbEntry from './DbEntry';
import DbRef from './DbRef';
import DatabaseConfig from './DatabaseConfig';
import DatabaseError from './DatabaseError';
import NotFoundError from './NotFoundError';
import DatabaseContext from './DatabaseContext';
import Database from './Database';
import WorkerPool from './WorkerPool';
import Category from './dbObjects/Category';

import JEL from '../jel/JEL';
import Context from '../jel/Context';
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
		let objectCount = 0, dirCount = 0;
		if (logFunction)
			logFunction(`Start bootstrapping database at ${database.dbPath} from ${dirPath}`);
		
		return (fs as any).readdir(dirPath, {withFileTypes: true}) // TODO: remove any when new readdir() signature is in fs-extra
			.then((files: any[]) => {  // TODO: use fs.Dirent here when available
				const dirs: string[] = files.filter(s=>s.isDirectory()).map(s=>s.name).sort();
				dirCount = dirs.length;
				return WorkerPool.run(dirs, (dir: string)=>{
					const fullDir = path.join(dirPath, dir);
					if (logFunction)
						logFunction("Loading database directory " + fullDir); 
					return database.loadDir(fullDir).then(c=>objectCount+=c);
				}, 1);
			})
			.then(()=>{
				if(logFunction)
					logFunction(`Bootstrap finished. Successfully loaded ${objectCount} objects from ${dirCount} directories.`);
				return objectCount;
			});
	}
	
	
}

