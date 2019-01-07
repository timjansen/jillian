import Util from '../util/Util';

import Context from '../jel/Context';
import JelObject from '../jel/JelObject';
import DefaultContext from '../jel/DefaultContext';
import NativeClass from '../jel/NativeClass';

import Database from './Database';
import DbSession from './DbSession';
import DbRef from './DbRef';

import DbEntry from './DbEntry';
import Category from './dbObjects/Category';
import Thing from './dbObjects/Thing';
import MixinProperty from './dbObjects/MixinProperty';
import PackageContent from '../jel/types/PackageContent';
import CategoryType from './dbProperties/CategoryType';
import ThingType from './dbProperties/ThingType';
import UnitValueQuantityType from './dbProperties/UnitValueQuantityType';
import UnitValueType from './dbProperties/UnitValueType';
import ReferenceDispatcherType from './dbProperties/ReferenceDispatcherType';
import DurationType from './dbProperties/DurationType';


function c(ctor: any): NativeClass {
  return new NativeClass(ctor);
}

const DB_IDENTIFIERS = {DbRef: c(DbRef), DbEntry: c(DbEntry), Category: c(Category), Thing: c(Thing), MixinProperty: c(MixinProperty), 
                        CategoryType: c(CategoryType), ReferenceDispatcherType: c(ReferenceDispatcherType), ThingType: c(ThingType), UnitValueQuantityType: c(UnitValueQuantityType),
                        DurationType: c(DurationType), UnitValueType: c(UnitValueType),duration: DurationType.instance,
												 ___IS_DATABASE_CONTEXT: 'magic123'};


export default class DatabaseContext extends Context {
  private cache = new Map<string, PackageContent|undefined>(); // undefined means DB lookup failed

  constructor(parent: Context|null, session: DbSession) {
    super(parent||DefaultContext.get(), session);
    this.setAll(DB_IDENTIFIERS, true);
  }

  private getFromDatabase(name: string): JelObject|null|undefined|Promise<JelObject|null|undefined> {
    if (this.cache.has(name)) 
      return this.cache.get(name);
    return Util.resolveValueAndError(this.dbSession!.get(name), dbe=> {
      if (dbe instanceof PackageContent) {
        this.cache.set(name, dbe);
        return dbe;
      }
      else {
        this.cache.set(name, undefined);
        return undefined;
      }
    }, ()=>{
      this.cache.set(name, undefined);
      return undefined;
    });
  }
  
 	hasInStaticScope(name: string): boolean {
		if (this.hasInThisScope(name))
      return true;
    if (this.parent!.has(name))
      return this.parent!.hasInStaticScope(name);
    return /^[A-Z]/.test(name);
	}
  
	get(name: string): JelObject|null|Promise<JelObject|null> {
    if (/^[a-z]/.test(name) || this.has(name))
      return super.get(name);

    return Util.resolveValue(this.getFromDatabase(name), r=>{
      if (r == null) 
        throw new Error(`Can not find identifier ${name}. Database lookup failed as well.`);
      else
        return r as any;      
    });
  }

	getOrNull(name: string): JelObject|null|Promise<JelObject|null> {
    if (/^[a-z]/.test(name) || this.has(name))
      return super.getOrNull(name);
    
    return Util.resolveValue(this.getFromDatabase(name), v=>v||null);
	}
}

