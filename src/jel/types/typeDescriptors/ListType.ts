import TypeDescriptor from './TypeDescriptor';
import TypeHelper from './TypeHelper';
import List from '../List';
import TypeChecker from '../TypeChecker';
import Dictionary from '../../types/Dictionary';
import Context from '../../Context';
import JelObject from '../../JelObject';
import BaseTypeRegistry from '../../BaseTypeRegistry';
import JelBoolean from '../JelBoolean';
import Util from '../../../util/Util';
import Class from '../Class';
import SerializablePrimitive from '../../SerializablePrimitive';



/**
 * Declares a property type that is a list.
 */
export default class ListType extends TypeDescriptor {
  static clazz: Class|undefined;
	public types: TypeDescriptor;
	
	/**
	 * types - one or more Types to define the acceptable member types of the list. 
	 *         The List may also contain 'null' as element, if the List can have nulls.
	 */
  constructor(types: JelObject|null) {
    super('ListType');
		this.types = TypeHelper.convertFromAny(types, 'list values');
  }
  
  get clazz(): Class {
    return ListType.clazz!;
  }
  
  checkType(ctx: Context, value: JelObject|null): JelBoolean|Promise<JelBoolean> {
    if (!(value instanceof List))
      return JelBoolean.FALSE;
    if (!this.types)
      return JelBoolean.TRUE;
    
    const open: Promise<JelBoolean>[] = [];
    for (let v of (value as List).elements) {
      const r: any = this.types.checkType(ctx, v as any);
      if (r instanceof Promise)
        open.push(r);
      else if (r instanceof JelBoolean && !r.toRealBoolean())
        return JelBoolean.FALSE;
    }
    if (open.length)
      return Promise.all(open).then(o=>o.find(r=>!r.toRealBoolean())||JelBoolean.TRUE);
    return JelBoolean.TRUE;
  }
  
  convert(ctx: Context, value: JelObject|null, fieldName=''): JelObject|Promise<JelObject> {
    if (value == null)
      return List.empty;
    if (value instanceof List) {
      if (this.types)
        return Util.resolveValue(this.checkType(ctx, value), (b: JelBoolean)=>b.toRealBoolean() ? value : Util.resolveArray(value.elements.map(v=>this.types.convert(ctx, v)), (e: any[])=>new List(e)));
      else
        return value;
    }
    if (!this.types)
      return new List([value]);
    return Util.resolveValue(this.types.convert(ctx, value), v=>new List([v]));
  }
  
  getSerializationProperties(): any[] {
    return [this.types];
  }
  
  serializeType(): string {
    return this.types ? `ListType(${this.types.serializeType()})` : `ListType()`;
  }
  
  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean|Promise<JelBoolean> {
    return other instanceof ListType ? TypeDescriptor.equals(ctx, this.types, other.types) : JelBoolean.FALSE;
  }
  
  static valueOf(e: JelObject|null): ListType {
    return new ListType(e);
  }


  static create_jel_mapping = true;
  static create(ctx: Context, ...args: any[]) {
    return new ListType(args[0]);
  }
}

BaseTypeRegistry.register('ListType', ListType);




