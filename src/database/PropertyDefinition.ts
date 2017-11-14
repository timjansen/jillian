import Category from './Category';
import DbEntry from './DbEntry';
import DbRef from './DbRef';
import PropertyType from './PropertyType';
import DbIndexDescriptor from './DbIndexDescriptor';
import Dictionary from '../jel/types/Dictionary';
import List from '../jel/types/List';


// Base class for any kind of physical or immaterial instance of a category
export default class PropertyDefinition extends DbEntry {
  JEL_PROPERTIES: Object;
  
  constructor(public distinctName: string, public type: PropertyType) {
    super(distinctName, null);
  }
  
  getSerializationProperties(): Object {
    return {distinctName: this.distinctName, type: this.type};
  }

  static create_jel_mapping = {distinctName: 0, propertyName: 1, type: 2};
  static create(...args: any[]) {
    return new PropertyDefinition(args[0], args[1]);
  }
}

PropertyDefinition.prototype.JEL_PROPERTIES = {distinctName: true};



