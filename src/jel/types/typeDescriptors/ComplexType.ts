import TypeDescriptor from './TypeDescriptor';
import TypeHelper from './TypeHelper';
import Dictionary from '../Dictionary';
import TypeChecker from '../TypeChecker';
import JelObject from '../../JelObject';
import List from '../List';
import Context from '../../Context';
import Serializer from '../../Serializer';
import JelBoolean from '../JelBoolean';
import Util from '../../../util/Util';
import BaseTypeRegistry from '../../BaseTypeRegistry';
import Class from '../Class';

/**
 * Defines a complex type that has named, typed fields. It is represented as a Dictionary in the DbEntry, but always has the same fields.
 * 
 */
export default class ComplexType extends TypeDescriptor {
  static clazz: Class|undefined;

  fields: Dictionary; // string->Type
  
  constructor(fields: Dictionary) {
    super('ComplexType');
    
    const m = new Map();
    fields.elements.forEach((v, n)=>{
      if ((Dictionary.empty as any)[n+'_jel_mapping'] || (Dictionary.empty.JEL_PROPERTIES as any)[n])
        throw new Error(`Illegal field name ${n}, you must not use any name that's defined in Dictionary.`);
      m.set(n, TypeHelper.convertFromAny(v, 'dictionary value'));
    });
    this.fields = new Dictionary(m);
  }
  
  get clazz(): Class {
    return ComplexType.clazz!;
  }
  
  checkType(ctx: Context, value: JelObject|null): JelBoolean|Promise<JelBoolean> {
    if (!(value instanceof Dictionary))
      return JelBoolean.FALSE;
    
    const open: Promise<JelBoolean>[] = [];
    let foundProblem = false;
    this.fields.elements.forEach((type, name)=>{
      const r: any = type && (type as any).checkType(ctx, value.elements.get(name)||null);
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
      return Promise.reject(new Error(`Failed type check ${fieldName}. Value must not be null.`));

    if (value instanceof Dictionary)
      return Util.resolveValue(this.checkType(ctx, value), (b: JelBoolean)=>b.toRealBoolean() ? value : this.fields.mapWithPromisesJs((name: string, td: TypeDescriptor)=>td.convert(ctx, value.elements.get(name)||null, fieldName)));
    else
      return Promise.reject(new Error(`Failed type convert ${fieldName}. Value ${value&&value.toString()} is not a Dictionary.`));
  }
  
  getSerializationProperties(): any[] {
    return [this.fields];
  }
  
  serializeType(): string {
    return Serializer.serialize(this.fields);
  }

  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean|Promise<JelBoolean> {
    if (!(other instanceof ComplexType && this.fields.size == other.fields.size))
      return JelBoolean.FALSE;
    
    return this.fields.hasOnlyWithPromises((k, v)=>JelBoolean.andWithPromises(JelBoolean.valueOf(other.fields.elements.get(k) != null), (other.fields.elements.get(k) as any).equals(ctx, this.fields.elements.get(k)!)));
  }

  static create_jel_mapping = ['fields'];
  static create(ctx: Context, clazz: any, ...args: any[]) {
    return new ComplexType(TypeChecker.instance(Dictionary, args[0], 'fields'));
  }
}
BaseTypeRegistry.register('ComplexType', ComplexType);




