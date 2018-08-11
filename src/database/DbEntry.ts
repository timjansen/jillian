import JelType from '../jel/JelType';
import Serializable from '../jel/Serializable';
import Dictionary from '../jel/types/Dictionary';
import DbIndexDescriptor from './DbIndexDescriptor';
import List from '../jel/types/List';

const tifu = require('tifuhash');

// Base class for any kind of physical or immaterial instance of a category
// Note that all references to other DbEntrys must be stored as a DbRef!!
export default class DbEntry extends JelType {
  
  constructor(public distinctName: string, public reality: any, 
							 public hashCode: string = tifu.hash(distinctName), 
							 public properties = new Dictionary()) {
    super();
  }
  
  // returns a map index_name->{type: 'index-type, always "category" for now', property: 'the name of the property to index', includeParents: 'bool. for categories, if true, index for all parent cats as well'}
  get databaseIndices(): Map<string, DbIndexDescriptor> {
    return new Map();
  }
	
	// sets a property
  set(name: string, value: JelType|number|string): DbEntry {
		this.properties.set(name, value);
		return this;
	}
	
  getSerializationProperties(): Object {
    return {distinctName: this.distinctName, reality: this.reality, properties: this.properties};
  }

  static create_jel_mapping : Object = {distinctName: 0, reality: 1, hashCode: 2, properties: 3};
  static create(...args: any[]): any {
    return new DbEntry(args[0], args[1], args[2], args[3]);
  }
}


