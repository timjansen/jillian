import BaseTypeRegistry from './BaseTypeRegistry';
import JelObject from './JelObject';
import Context from './Context';
import Serializer from './Serializer';
import FunctionCallable from './FunctionCallable';


/**
 * This is the base class for type defining classes.
 */
export default interface IClass extends JelObject {
  className: string;
}

