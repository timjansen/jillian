import JelNode from './JelNode';
import Assignment from './Assignment';
import JelObject from '../JelObject';
import Callable from '../Callable';
import Context from '../Context';
import Serializable from '../Serializable';

/**
 * Represents a method in a class.
 * Abstract methods have expression==null
 */
export default class Method extends Assignment implements Serializable {
  constructor(name: string, expression: JelNode|null, public isOverride: boolean, public isNative: boolean) {
    super(name, expression);
  }

  // override
  equals(other?: JelNode): boolean {
		if (!(other instanceof Method))
			return false;
		return this.name == other.name && 
      ((this.expression && other.expression)? this.expression.equals(other.expression) : !other.expression) &&
      this.isOverride == other.isOverride &&
      this.isNative == other.isNative;
	}
  
  getSerializationProperties(): Object {
    return [this.name, this.expression, this.isOverride, this.isNative];
  }
}

