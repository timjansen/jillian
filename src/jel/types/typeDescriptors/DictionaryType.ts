import TypeDescriptor from './TypeDescriptor';
import TypeHelper from './TypeHelper';
import Dictionary from '../Dictionary';
import List from '../List';
import TypeChecker from '../TypeChecker';
import JelObject from '../../JelObject';
import Context from '../../Context';
import BaseTypeRegistry from '../../BaseTypeRegistry';
import JelBoolean from '../JelBoolean';
import Util from '../../../util/Util';
import Class from '../Class';



/**
 * Declares a property type that is a Dictionary.
 */
export default class DictionaryType extends TypeDescriptor {
  static clazz: Class|undefined;
	public valueTypes: TypeDescriptor|null;
	
	/**
	 * @param valueTypes one or more Types or DbRefs to define the acceptable member types for the values. 
	 *              DbRefs will be converted to SimpleTypes. Dictionary into DictionaryType.
	 */
  constructor(valueTypes: JelObject|null) {
    super('DictionaryType');
		this.valueTypes = TypeHelper.convertFromAny(valueTypes, 'dictionary values');
  }
  
  get clazz(): Class {
    return DictionaryType.clazz!;
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
  
  convert(ctx: Context, value: JelObject|null, fieldName=''):  JelObject|null|Promise<JelObject|null> {
    if (value == null)
      return Dictionary.empty;
    if (value instanceof Dictionary) {
      if (this.valueTypes)
        return Util.resolveValue(this.checkType(ctx, value), (b: JelBoolean)=>b.toRealBoolean() ? value : value.mapWithPromisesJs((k: string, v: any)=>this.valueTypes!.convert(ctx, v)));
      else
        return value;
    }
    else
      return Promise.reject(new Error(`Failed to convert${fieldName?' '+fieldName:''}. Value ${value&&value.toString()} is not a Dictionary.`));
  }

  
  getSerializationProperties(): any[] {
    return [this.valueTypes];
  }

  serializeType(): string {
    return this.valueTypes ? `DictionaryType(${this.valueTypes.serializeType()})` : `DictionaryType()`;
  }
  
  static valueOf(e: JelObject|null): DictionaryType {
    return new DictionaryType(e);
  }
  
  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean|Promise<JelBoolean> {
    return other instanceof DictionaryType ? TypeDescriptor.equals(ctx, this.valueTypes, other.valueTypes) : JelBoolean.FALSE;
  }
  
  static create_jel_mapping = true;
  static create(ctx: Context, ...args: any[]) {
    return new DictionaryType(args[0]);
  }
}
BaseTypeRegistry.register('DictionaryType', DictionaryType);




