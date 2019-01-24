import JelObject from './JelObject';
import Serializable from './Serializable';
import Context from './Context';

const tifu = require('tifuhash');

// Base class for all named objects.
export default abstract class NamedObject extends JelObject {
	
  constructor(className: string, public distinctName: string, public hashCode: string = tifu.hash(distinctName)) {
    super(className);
  }
}


