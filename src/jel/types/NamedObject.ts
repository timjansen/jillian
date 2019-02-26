import JelObject from '../JelObject';
import Serializable from '../Serializable';
import Context from '../Context';
import NativeJelObject from './NativeJelObject';

const tifu = require('tifuhash');

// Base class for all named objects.
export default abstract class NamedObject extends NativeJelObject {
	distinctName_jel_property: boolean;
	hashCode_jel_property: boolean;
  
  constructor(className: string, public distinctName: string, public hashCode: string = tifu.hash(distinctName)) {
    super(className);
  }
}

const p: any = NamedObject.prototype;
p.distinctName_jel_property = true;
p.hashCode_jel_property = true;
