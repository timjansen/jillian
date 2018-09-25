import JelType from '../jel/JelType';
import Serializable from '../jel/Serializable';
import Context from '../jel/Context';
import {IDbEntry} from '../jel/IDatabase';
import Dictionary from '../jel/types/Dictionary';
import DbIndexDescriptor from './DbIndexDescriptor';
import DbRef from './DbRef';
import List from '../jel/types/List';

const tifu = require('tifuhash');

// Base class for any kind of physical or immaterial instance of a category
// Note that all references to other DbEntrys must be stored as a DbRef!!
export default class DbEntry extends JelType implements IDbEntry {
  isDBEntry: boolean;
	
  constructor(public distinctName: string, public reality: any, 
							 public hashCode: string = tifu.hash(distinctName), 
							 public properties = new Dictionary()) {
    super();
  }
  
  // returns a map index_name->{type: 'index-type, always "category" for now', property: 'the name of the property to index', includeParents: 'bool. for categories, if true, index for all parent cats as well'}
  get databaseIndices(): Map<string, DbIndexDescriptor> {
    return new Map();
  }
	
	member(ctx: Context, name: string, parameters?: Map<string, any>): any {
		const v = super.member(ctx, name, parameters);
		if (v === undefined && this.properties.elements.has(name))
			return this.properties.get(ctx, name);
		else
			return v;
	}
	
	// Calls callback with value of member. If it's a DbRef, it's automatically resolved.
	withMember<T>(ctx: Context, name: string, f: (value: any)=>T): T | Promise<T> {
		const v = this.member(ctx, name);
		if (v instanceof DbRef)
			return v.with(ctx, f);
		else if (v instanceof Promise)
			return v.then(val=>val instanceof DbRef ? val.with(ctx, f) : f(val));
		else
			return f(v);
	}
		
	// sets a property
  set(ctx: Context, name: string, value: JelType|number|string): DbEntry {
		this.properties.set(name, value);
		return this;
	}
	
  getSerializationProperties(): Object {
    return {distinctName: this.distinctName, reality: this.reality, properties: this.properties};
  }

  static create_jel_mapping : Object = {distinctName: 1, reality: 2, hashCode: 3, properties: 4};
  static create(ctx: Context, ...args: any[]): any {
    return new DbEntry(args[0], args[1], args[2], args[3]);
  }
}

DbEntry.prototype.isDBEntry = true;

