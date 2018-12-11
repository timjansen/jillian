import TypeDescriptor from './TypeDescriptor';
import TypeHelper from './TypeHelper';
import {IDbRef, IDbEntry} from '../../IDatabase';
import Dictionary from '../Dictionary';
import List from '../List';
import TypeChecker from '../TypeChecker';
import JelObject from '../../JelObject';
import Context from '../../Context';
import BaseTypeRegistry from '../../BaseTypeRegistry';
import JelBoolean from '../JelBoolean';



/**
 * Declares a property type that is a Dictionary.
 */
export default class DictionaryType extends TypeDescriptor {
	public valueTypes: TypeDescriptor|null;
	
	/**
	 * @param valueTypes one or more Types or DbRefs to define the acceptable member types for the values. 
	 *              DbRefs will be converted to SimpleTypes. Dictionary into DictionaryType.
	 */
  constructor(valueTypes: JelObject|null) {
    super();
		this.valueTypes = TypeHelper.convertFromAny(valueTypes, 'dictionary values');
  }

  checkType(ctx: Context, value: JelObject|null): JelBoolean|Promise<JelBoolean> {
    if (!(value instanceof Dictionary))
      return JelBoolean.FALSE;
    if (!this.valueTypes)
      return JelBoolean.TRUE;
    
    const open: Promise<JelBoolean>[] = [];
    let foundProblem = false;
    (value as Dictionary).elements.forEach((v, name)=>{
      const r: any = this.valueTypes!.checkType(ctx, v as any);
      if (r instanceof Promise)
        open.push(r);
      else if (r instanceof JelBoolean && !r.toRealBoolean())
        foundProblem = true;
    });
    if (foundProblem)
      return JelBoolean.FALSE;
    if (open.length)
      return Promise.all(open).then(o=>o.find(r=>!r.toRealBoolean())||JelBoolean.TRUE);
    return JelBoolean.TRUE;
  }

  
  getSerializationProperties(): Object {
    return [this.valueTypes];
  }

  serializeType(): string {
    return this.valueTypes ? `DictionaryType(${this.valueTypes.serializeType()})` : `DictionaryType()`;
  }
  
  static valueOf(e: JelObject|null): DictionaryType {
    return new DictionaryType(e);
  }
  
  static create_jel_mapping = ['valueTypes'];
  static create(ctx: Context, ...args: any[]) {
    return new DictionaryType(args[0]);
  }
}
BaseTypeRegistry.register('DictionaryType', DictionaryType);




