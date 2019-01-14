import NamedObject from '../NamedObject';
import Context from '../Context';
import Dictionary from './Dictionary';

// Base class for all classes accessible in Jel and yet stored in the database
export default abstract class PackageContent extends NamedObject {
  public packageName: string;
 
  constructor(distinctName: string) {
    super(distinctName);
    this.packageName = distinctName.replace(/::[^:]+$/, '');
  }

}
