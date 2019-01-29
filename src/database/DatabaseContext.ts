import * as path from 'path';
import Util from '../util/Util';

import Context from '../jel/Context';
import JelObject from '../jel/JelObject';
import DefaultContext from '../jel/DefaultContext';
import NativeClass from '../jel/NativeClass';
import {IDbSession} from '../jel/IDatabase';

import Database from './Database';
import DbSession from './DbSession';
import DbRef from './DbRef';

import DbEntry from './DbEntry';
import Category from './dbObjects/Category';
import Thing from './dbObjects/Thing';
import MixinProperty from './dbObjects/MixinProperty';
import PackageContent from '../jel/types/PackageContent';
import CategoryType from './dbTypes/CategoryType';
import ThingType from './dbTypes/ThingType';
import UnitValueQuantityType from './dbTypes/UnitValueQuantityType';
import UnitValueType from './dbTypes/UnitValueType';
import ReferenceDispatcherType from './dbTypes/ReferenceDispatcherType';
import DurationType from './dbTypes/DurationType';


function c(ctor: any): NativeClass {
  return new NativeClass(ctor);
}

const DB_IDENTIFIERS = {DbRef: c(DbRef), DbEntry: c(DbEntry), Category: c(Category), Thing: c(Thing), MixinProperty: c(MixinProperty)};

const BOOT_SCRIPT = [
  {static: {duration: DurationType.instance}},
  {jel: 'typeDescriptors/CategoryType.jel', native: CategoryType},
  {jel: 'typeDescriptors/ThingType.jel', native: ThingType},
  [
    {jel: 'typeDescriptors/DurationType.jel', native: DurationType},
    {jel: 'typeDescriptors/ReferenceDispatcherType.jel', native: ReferenceDispatcherType},
    {jel: 'typeDescriptors/UnitValueQuantityType.jel', native: UnitValueQuantityType},
    {jel: 'typeDescriptors/UnitValueType.jel', native: UnitValueType}
  ],
  {static: DB_IDENTIFIERS}
];

const BOOTSTRAP_DIR = path.join(__dirname, '../../database-load/bootstrap/');



export default class DatabaseContext extends Context {

  private cache = new Map<string, PackageContent|undefined>(); // undefined means DB lookup failed

  constructor(parent: Context|undefined, session: DbSession) {
    super(parent, session);
  }

  static async get(session: DbSession): Promise<DatabaseContext> {
    const dc = await DefaultContext.createBootContext(BOOTSTRAP_DIR, BOOT_SCRIPT, await DefaultContext.get());
    const ctx = new DatabaseContext(dc, session);
    ctx.freeze();
    return ctx;
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

