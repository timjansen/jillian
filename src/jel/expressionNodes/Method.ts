import JelNode from './JelNode';
import Assignment from './Assignment';
import JelObject from '../JelObject';
import Callable from '../Callable';
import Context from '../Context';
import Serializable from '../Serializable';

/**
 * Represents a method in a class.
 */
export default class Method extends Assignment implements Serializable {
  constructor(name: string, expression: JelNode, public isOverride: boolean, public isNative: boolean) {
    super(name, expression);
  }

  // override
  equals(other?: JelNode): boolean {
		if (!(other instanceof Method))
			return false;
		return this.name == other.name && 
      this.expression.equals(other.expression) &&
      this.isOverride == other.isOverride &&
      this.isNative == other.isNative;
	}

}

