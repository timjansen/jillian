import DbEntry from '../DbEntry';
import Context from '../../jel/Context';
import Dictionary from '../../jel/types/Dictionary';

// Base class for all classes accessible in Jel and yet stored in the database
export default abstract class DatabaseType extends DbEntry {
  public package: string;
 
  constructor(distinctName: string, properties?: Dictionary) {
    super(distinctName, undefined, undefined, properties);
    this.package = distinctName.replace(/.*::/, '');
  }

}
