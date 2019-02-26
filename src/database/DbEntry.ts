import Util from '../util/Util';
import JelObject from '../jel/JelObject';
import NamedObject from '../jel/types/NamedObject';
import Class from '../jel/types/Class';
import Serializable from '../jel/Serializable';
import Context from '../jel/Context';
import Dictionary from '../jel/types/Dictionary';
import DbIndexDescriptor from './DbIndexDescriptor';
import DbRef from './DbRef';
import JelString from '../jel/types/JelString';
import Timestamp from '../jel/types/time/Timestamp';
import List from '../jel/types/List';
import TypeChecker from '../jel/types/TypeChecker';
import BaseTypeRegistry from '../jel/BaseTypeRegistry';

const tifu = require('tifuhash');

/**
 * A base class for database entries that support Facts.
 */
export default class DbEntry extends NamedObject {
  reality_jel_property: boolean;
  facts_jel_property: boolean;
  
  isIDBEntry: boolean;
  static clazz: Class|undefined;

  constructor(className: string, distinctName: string,
							public facts = new Dictionary(),
              public reality?: DbRef,
              hashCode: string = tifu.hash(distinctName)) {
    super(className, distinctName, hashCode);
  }
  
  get clazz(): Class {
    return DbEntry.clazz!;
  }  
  
  // returns a map index_name->{type: 'index-type, always "category" for now', property: 'the name of the property to index', includeParents: 'bool. for categories, if true, index for all parent cats as well'}
  get databaseIndices(): Map<string, DbIndexDescriptor> {
    return new Map();
  }
  
  toRef(): DbRef {
    return new DbRef(this);
  }
	
	// Calls callback with value of member. If it's a DbRef, it's automatically resolved.
	withMember<T>(ctx: Context, name: string, f: (value: any)=>T): T | Promise<T> {
		const v = this.member(ctx, name);
		if (v instanceof DbRef)
			return v.with(ctx, f);
		else if (v instanceof Promise)
			return v.then(val=>val instanceof DbRef ? val.with(ctx, f) : f(val));
		else
			return f(v);
	}
  
	member(ctx: Context, name: string): JelObject|null|Promise<JelObject|null>|undefined {
    const r = super.member(ctx, name);
    if (r !== undefined)
      return r;
    return Util.resolveValue(this.getFactValue(ctx, name), v=>v==null?undefined:v);
	}

  getFactValue(ctx: Context, name: string, t: Timestamp = Timestamp.ZERO_TIME): Promise<JelObject|null>|JelObject|null {
    return this.withMember(ctx, 'getBestValue', callable=>Util.resolveValue(callable.invoke(this, JelString.valueOf(name), t), (factResult: any)=>factResult && factResult.member(ctx, 'value')));
  }

  	// Calls callback with value of member. If it's a DbRef, it's automatically resolved.
	withFact<T>(ctx: Context, name: string, f: (value: any)=>T): T | Promise<T> {
		const v = this.getFactValue(ctx, name);
		if (v instanceof DbRef)
			return v.with(ctx, f);
		else if (v instanceof Promise)
			return v.then(val=>val instanceof DbRef ? val.with(ctx, f) : f(val));
		else
			return f(v);
	}

  
  getSerializationProperties(): any[] {
    return [this.distinctName, this.facts, this.reality, this.hashCode];
  }

  static valueOf(distinctName: string, facts: Dictionary = Dictionary.empty, reality?: DbRef, hashCode: string = tifu.hash(distinctName)): DbEntry {
    return new DbEntry('DbEntry', distinctName, facts, reality, hashCode);
  }

  
  static create_jel_mapping : Object = true;
  static create(ctx: Context, ...args: any[]): any {
    return new DbEntry('DbEntry', TypeChecker.realString(args[0], 'distinctName'), TypeChecker.instance(Dictionary, args[1], 'facts'), 
                       (TypeChecker.optionalDbRef(args[2], 'reality')||undefined) as any, TypeChecker.optionalRealString(args[3], 'hashCode')||undefined);
  }
}

DbEntry.prototype.isIDBEntry = true;
DbEntry.prototype.reality_jel_property = true;
DbEntry.prototype.facts_jel_property = true;

BaseTypeRegistry.register('DbEntry', DbEntry);


