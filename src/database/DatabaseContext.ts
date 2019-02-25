import * as path from 'path';
import Util from '../util/Util';

import Context from '../jel/Context';
import JelObject from '../jel/JelObject';
import DefaultContext from '../jel/DefaultContext';
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
import Unit from '../jel/types/Unit';
import UnitValue from '../jel/types/UnitValue';




const BOOT_SCRIPT = [
  {static: {duration: DurationType.instance, category: CategoryType.instance, thing: ThingType.instance}}, 
  {jel: 'typeDescriptors/CategoryType.jel', native: CategoryType},
  {jel: 'typeDescriptors/ThingType.jel', native: ThingType},
  
  {jel: 'objects/Unit.jel', native: Unit},
  {jel: 'objects/UnitValue.jel', native: UnitValue},

  [
    {jel: 'typeDescriptors/DurationType.jel', native: DurationType},
    {jel: 'typeDescriptors/ReferenceDispatcherType.jel', native: ReferenceDispatcherType},
    {jel: 'typeDescriptors/UnitValueQuantityType.jel', native: UnitValueQuantityType},
    {jel: 'typeDescriptors/UnitValueType.jel', native: UnitValueType}
  ],
  [
    {jel: 'objects/FactRelationshipEnum.jel'},
    {jel: 'objects/FactTypeEnum.jel'},
    {jel: 'objects/PropertyTypeEnum.jel'},
  ],
  {jel: 'objects/Fact.jel'},
  {jel: 'objects/FactList.jel'},
  {jel: 'objects/DbEntry.jel', native: DbEntry},
  {jel: 'objects/Category.jel', native: Category},
  [
    {jel: 'objects/DbRef.jel', native: DbRef},
    {jel: 'objects/MixinProperty.jel', native: MixinProperty},
    {jel: 'objects/Thing.jel', native: Thing}
  ],
];

const BOOTSTRAP_DIR = path.join(__dirname, '../../database-load/bootstrap/');



export default class DatabaseContext extends Context {

  private cache = new Map<string, PackageContent|undefined>(); // undefined means DB lookup failed

  constructor(parent: Context|undefined, session: DbSession) {
    super(parent, session);
  }

  static async get(session: DbSession): Promise<Context> {
    const dc = new DatabaseContext(undefined, session);
    const defCtx = await DefaultContext.loadDefaultContext(dc);
    const ctx = await DefaultContext.createBootContext(BOOTSTRAP_DIR, BOOT_SCRIPT, defCtx);
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
    if (this.parent && this.parent.has(name))
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

