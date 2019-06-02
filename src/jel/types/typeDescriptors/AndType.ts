import TypeDescriptor from './TypeDescriptor';
import TypeHelper from './TypeHelper';
import List from '../List';
import BaseTypeRegistry from '../../BaseTypeRegistry';
import Context from '../../Context';
import JelObject from '../../JelObject';
import JelBoolean from '../JelBoolean';
import Class from '../Class';


/**
 * Declares a property can have more than one type.
 */
export default class AndType extends TypeDescriptor {
  static clazz: Class|undefined;

	requirements: List; // of TypeDescriptor|null
  nullable: boolean|undefined;

  constructor(requirements: JelObject|null) {
    super('AndType');
		this.requirements = new List(requirements instanceof List ? requirements.elements.map(e=>TypeHelper.convertNullableFromAny(e, 'list of property types')) : [TypeHelper.convertNullableFromAny(requirements, 'list of property types')]);
  }
  
  get clazz(): Class {
    return AndType.clazz!;
  }
  
  getSerializationProperties(): any[] {
    return [this.requirements];
  }
	
  checkType(ctx: Context, value: JelObject|null): JelBoolean|Promise<JelBoolean> {
    const open: Promise<JelBoolean>[] = [];
    for (let type of this.requirements.elements) {
      if (type == null) {
        if (value != null)
          return JelBoolean.FALSE;
      }
      else {
        const r: any = type.checkType(ctx, value as any);
        if (r instanceof Promise)
          open.push(r);
        else if (r instanceof JelBoolean && !r.toRealBoolean())
          return JelBoolean.FALSE;
      }
    }
    if (open.length)
      return Promise.all(open).then(o=>JelBoolean.valueOf(!o.find(r=>!r.toRealBoolean())));
    return JelBoolean.TRUE;
  }
    
  static valueOf(e: JelObject[]): AndType {
    return new AndType(new List(e));
  }
  
  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean|Promise<JelBoolean> {
    if (!(other instanceof AndType && this.requirements.size == other.requirements.size))
      return JelBoolean.FALSE;
    
    return this.requirements.hasOnlyWithPromises((v, i)=>TypeDescriptor.equals(ctx, v as TypeDescriptor, other.requirements.elements[i]));
  }

  isNullable(ctx: Context): boolean {
    if (this.nullable == null)
      this.nullable = this.requirements.hasOnlyJs(l=>l==null||(l as any).isNullable(ctx));
    return this.nullable;
  }
  
  serializeType(): string {  
    return `AndType([${this.requirements.elements.map(r=>r ? r.serializeType() : 'null').join(', ')}])`;
  }
  
  static create_jel_mapping = true;
  static create(ctx: Context, ...args: any[]) {
    return new AndType(args[0]);
  }
}

BaseTypeRegistry.register('AndType', AndType);



