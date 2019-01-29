import BaseTypeRegistry from './BaseTypeRegistry';
import JelObject from './JelObject';
import Context from './Context';
import Serializer from './Serializer';


/**
 * This is the base class for type defining classes.
 */
export default interface IClass extends JelObject {
  className: string;
  iClass: boolean;
}

