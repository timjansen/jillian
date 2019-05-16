import TypeDescriptor from './TypeDescriptor';
import TypeHelper from './TypeHelper';
import {IDbRef} from '../../IDatabase';
import Dictionary from '../../types/Dictionary';
import List from '../../types/List';
import TypeChecker from '../../types/TypeChecker';
import BaseTypeRegistry from '../../BaseTypeRegistry';
import Context from '../../Context';
import JelObject from '../../JelObject';
import JelBoolean from '../JelBoolean';
import Class from '../Class';
import SerializablePrimitive from '../../SerializablePrimitive';


/**
 * Declares a property can have more than one type.
 */
export default class OptionType extends TypeDescriptor {
  static clazz: Class|undefined;

	options: List; // of TypeDescriptor or null
  nullable: boolean;
	
  constructor(options: JelObject|null) {
    super('OptionType');
		this.options = new List(options instanceof List ? options.elements.map(e=>TypeHelper.convertNullableFromAny(e, 'list of property types')) : [TypeHelper.convertNullableFromAny(options, 'list of property types')]);
    this.nullable = this.options.elements.findIndex(l=>l==null||l.isNullable())>=0;
  }
  
  get clazz(): Class {
    return OptionType.clazz!;
  }
  
  getSerializationProperties(): any[] {
    return [this.options];
  }
	
  checkType(ctx: Context, value: JelObject|null): JelBoolean|Promise<JelBoolean> {
    const open: Promise<JelBoolean>[] = [];
    for (let type of this.options.elements) {
      if (type == null) {
        if (value == null)
          return JelBoolean.TRUE;
      }
      else {
        const r: any = type.checkType(ctx, value as any);
        if (r instanceof Promise)
          open.push(r);
        else if (r instanceof JelBoolean && r.toRealBoolean())
          return JelBoolean.TRUE;
      }
    }
    if (open.length)
      return Promise.all(open).then(o=>o.find(r=>r.toRealBoolean())||JelBoolean.FALSE);
    return JelBoolean.FALSE;
  }
    
  static valueOf(e: JelObject[]): OptionType {
    return new OptionType(new List(e));
  }
  
  equals(ctx: Context, other: TypeDescriptor|null): JelBoolean|Promise<JelBoolean> {
    if (!(other instanceof OptionType && this.options.size == other.options.size))
      return JelBoolean.FALSE;
    
    return this.options.hasOnlyWithPromises((v, i)=>TypeDescriptor.equals(ctx, v as TypeDescriptor, other.options.elements[i]));
  }

  isNullable(ctx: Context): boolean {
    return this.nullable;
  }
  
  serializeType(): string {  
    return `OptionType([${this.options.elements.map(option=>option ? option.serializeType() : 'null').join(', ')}])`;
  }
  
  static create_jel_mapping = true;
  static create(ctx: Context, ...args: any[]) {
    return new OptionType(args[0]);
  }
}

BaseTypeRegistry.register('OptionType', OptionType);



