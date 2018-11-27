import Util from '../util/Util';

import Context from '../jel/Context';
import DefaultContext from '../jel/DefaultContext';

import Database from './Database';
import DbEntry from './DbEntry';
import DbSession from './DbSession';
import DbRef from './DbRef';

import Category from './dbObjects/Category';
import Thing from './dbObjects/Thing';
import Enum from './dbObjects/Enum';
import MixinProperty from './dbObjects/MixinProperty';
import TypeDefinition from './dbObjects/TypeDefinition';
import CategoryPropertyType from './dbProperties/CategoryPropertyType';





const DB_IDENTIFIERS = {DbEntry, DbRef, Category, Thing, Enum, MixinProperty, TypeDefinition, CategoryPropertyType,
												 ___IS_DATABASE_CONTEXT: 'magic123'};


export default class DatabaseContext extends Context {

  constructor(parent: Context|null, session: DbSession) {
    super(parent||DefaultContext.get(), session);
    this.setAll(DB_IDENTIFIERS);
  }

  private genericGet(name: string): any {
		try {
  		return super.get(name);
    }
    catch (e) {
      return Util.resolveValue(this.dbSession!.get(name), dbe=>((dbe instanceof TypeDefinition) || (dbe instanceof Enum)) ? dbe : undefined);
    }   
  }
  
	get(name: string): any {
    if (/^[a-z]/.test(name))
      return super.get(name);
        
    const r = this.genericGet(name);
    if (r === undefined)
   		throw new Error(`Can not read unknown variable ${name}.`);
    return r;
	}

	getOrNull(name: string): any {
    if (/^[a-z]/.test(name))
      return super.getOrNull(name);
    
    return this.genericGet(name) || null;
	}  
}

