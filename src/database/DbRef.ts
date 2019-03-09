import Util from '../util/Util';
import JelObject from '../jel/JelObject';
import NativeJelObject from '../jel/types/NativeJelObject';
import Context from '../jel/Context';
import SerializablePrimitive from '../jel/SerializablePrimitive';
import Class from '../jel/types/Class';
import Dictionary from '../jel/types/Dictionary';
import JelBoolean from '../jel/types/JelBoolean';
import JelString from '../jel/types/JelString';
import {
  IDbRef
} from '../jel/IDatabase';
import NamedObject from '../jel/types/NamedObject';
import DbSession from './DbSession';
import Database from './Database';
import NotFoundError from './NotFoundError';
import BaseTypeRegistry from '../jel/BaseTypeRegistry';


export default class DbRef extends NativeJelObject implements IDbRef, SerializablePrimitive {
  distinctName_jel_property: boolean;
  parameters_jel_property: boolean;

  distinctName: string;
  cached: NamedObject | undefined | null; // stores null for entries that have not been found, undefined if the existance is unknown
  readonly isIDBRef: boolean = true;
  static clazz: Class | undefined;

  constructor(distinctNameOrEntry: string | JelString | NamedObject, public parameters ? : Dictionary) {
    super('DbRef');
    if (distinctNameOrEntry instanceof NamedObject) {
      this.distinctName = distinctNameOrEntry.distinctName;
      this.cached = distinctNameOrEntry;
    } else
      this.distinctName = JelString.toRealString(distinctNameOrEntry);
  }

  get clazz(): Class {
    return DbRef.clazz!;
  }

  // returns either NamedObject or Promise! Rejects promise if not found.
  get(ctx: Context): NamedObject | Promise < NamedObject > {
    if (this.cached != null)
      return this.cached;
    else if (this.cached === null)
      return Promise.reject(new NotFoundError(this.distinctName));

    const o = (ctx.getSession() as DbSession).get(this.distinctName);
    if (o instanceof Promise)
      return o.then((r: NamedObject) => this.cached = r)
        .catch((e: any) => {
          if (e instanceof NotFoundError)
            this.cached = null;
          return Promise.reject(e);
        });
    else
      return this.cached = o;
  }


  // Executes function with the object. Returns f()'s return value, either directly or in Promise
  with < T > (ctx: Context, f: (obj: NamedObject) => T): Promise < T > | T {
    if (this.cached != null)
      return f(this.cached);
    else if (this.cached === null)
      return Promise.reject(new NotFoundError(this.distinctName));

    const o = (ctx.getSession() as DbSession).get(this.distinctName);
    if (o instanceof Promise)
      return o.catch((e: any) => {
          if (e instanceof NotFoundError)
            this.cached = null;
          return Promise.reject(e);
        })
        .then((r: NamedObject) => f(this.cached = r));
    else
      return f(this.cached = o);
  }

  // Retrieves a single member from the object and calls the callback function with it. 
  withMember < T > (ctx: Context, name: string, f: (v: any) => T): Promise < T > | T {
    return this.with(ctx, o => o.withMember(ctx, name, f)) as Promise < T > | T;
  }

  hasSameParameters(right: DbRef): boolean {
    if (!this.parameters != !right.parameters)
      return false;
    if (!this.parameters || !right.parameters)
      return true;
    if (this.parameters.size != right.parameters.size)
      return false;
    for (let a in this.parameters.elements.keys())
      if ((!right.parameters.elements.has(a)) || this.parameters.elements.get(a) !== right.parameters.elements.get(a))
        return false;
    return true;
  }

  private memberInternal(ctx: Context, obj: NamedObject | null, name: string): any {
    if (obj === null)
      return null;
    else
      return obj.member(ctx, name);
  }

  // Returns the member value with the given name, possibly wrapped in a Promise
  member(ctx: Context, name: string): Promise < any > | any {
    return this.with(ctx, (o: NamedObject) => this.memberInternal(ctx, o, name));
  }

  op(ctx: Context, operator: string, right: any): any {
    if (right instanceof DbRef) {
      switch (operator) {
        case '==':
          return JelBoolean.valueOf(this.distinctName == right.distinctName);
        case '!=':
          return JelBoolean.valueOf(this.distinctName != right.distinctName);
        case '===':
          return JelBoolean.fourWay(ctx, this.distinctName == right.distinctName, this.hasSameParameters(right));
        case '!==':
          return JelBoolean.fourWay(ctx, this.distinctName == right.distinctName, this.hasSameParameters(right)).negate();
      }
    }
    return super.op(ctx, operator, right);
  }

  getAsync(ctx: Context): Promise < NamedObject | null > {
    const v = this.get(ctx);
    if (v instanceof Promise)
      return v;
    else
      return Promise.resolve(v);
  }

  // returns either NamedObject or Promise!
  getFromDb(ctx: Context): NamedObject | Promise < NamedObject > {
    if (this.cached != null)
      return this.cached;
    else if (this.cached === null)
      return Promise.reject(new NotFoundError(this.distinctName));
    else
      return (ctx.getSession() as DbSession).getFromDatabase(this.distinctName);
  }

  toRef(): DbRef {
    return this;
  }

  get isAvailable(): boolean {
    return this.cached !== undefined;
  }

  getSerializationProperties(): any[] {
    return this.parameters ? [this.distinctName, this.parameters] : [this.distinctName];
  }

  serializeToString(pretty: boolean, indent: number, spaces: string): string | undefined {
    return this.parameters ? undefined : '@' + this.distinctName;
  }

  static toPromise(ctx: Context, ref: DbRef | NamedObject): Promise < NamedObject | null > {
    return Promise.resolve(ref instanceof DbRef ? ref.get(ctx) : ref);
  }

  static create_jel_mapping = true;
  static create(ctx: Context, ...args: any[]): any {
    if (args[0] instanceof DbRef)
      return args[0];
    return new DbRef(args[0], args[1] instanceof Map ? args[1] : (args[1] instanceof Dictionary ? args[1] : null));
  }
}

DbRef.prototype.distinctName_jel_property = true;
DbRef.prototype.parameters_jel_property = true;

BaseTypeRegistry.register('DbRef', DbRef);