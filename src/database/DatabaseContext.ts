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


import CategoryPropertyType from './dbProperties/CategoryPropertyType';
import ComplexPropertyType from './dbProperties/ComplexPropertyType';
import DictionaryPropertyType from './dbProperties/DictionaryPropertyType';
import FunctionPropertyType from './dbProperties/FunctionPropertyType';
import ListPropertyType from './dbProperties/ListPropertyType';
import OptionPropertyType from './dbProperties/OptionPropertyType';
import SimplePropertyType from './dbProperties/SimplePropertyType';



const DB_IDENTIFIERS = {DbEntry, DbRef, Category, Thing, Enum, MixinProperty, 
                        CategoryPropertyType, ComplexPropertyType, DictionaryPropertyType, FunctionPropertyType, ListPropertyType, OptionPropertyType, SimplePropertyType, 
												 ___IS_DATABASE_CONTEXT: 'magic123'};


export default class DatabaseContext {
	static readonly DB_CONTEXT = DefaultContext.plus(DB_IDENTIFIERS);

	static get(): Context {
		return DatabaseContext.DB_CONTEXT;
	}
	
	static forDatabase(database: Database): Context {
		const session = new DbSession(database, DatabaseContext.DB_CONTEXT);
		return session.ctx;
  }
	
	static add(ctx?: Context): Context {
		if (!ctx)
			return DatabaseContext.DB_CONTEXT;
		else if (ctx.getOrNull('___IS_DATABASE_CONTEXT') == 'magic123')
			return ctx;
		else
	    return ctx.plus(DB_IDENTIFIERS);
	}
}

