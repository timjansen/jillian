import JelObject from '../jel/JelObject';
import Context from '../jel/Context';
import SerializablePrimitive from '../jel/SerializablePrimitive';
import JelBoolean from '../jel/types/JelBoolean';
import JelString from '../jel/types/JelString';
import {IDbRef} from '../jel/IDatabase';
import NamedObject from '../jel/NamedObject';
import DbSession from './DbSession';
import Database from './Database';
import NotFoundError from './NotFoundError';


export default class DbRef extends JelObject implements IDbRef, SerializablePrimitive {
	distinctName: string;
	cached: NamedObject | undefined | null;    // stores null for entries that have not been found, undefined if the existance is unknown
	readonly isIDBRef: boolean = true;
	
	constructor(distinctNameOrEntry: string | JelString | NamedObject, public parameters?: Map<string, any>) {
		super();
		if (distinctNameOrEntry instanceof NamedObject) {
			this.distinctName = distinctNameOrEntry.distinctName;
			this.cached = distinctNameOrEntry;
		}
		else
			this.distinctName = JelString.toRealString(distinctNameOrEntry);
	}
	
	// returns either NamedObject or Promise! Rejects promise if not found.
	get(ctx: Context): NamedObject | Promise<NamedObject> {
		if (this.cached != null)
			return this.cached;
		else if (this.cached === null)
			return Promise.reject(new NotFoundError(this.distinctName));

		const o = (ctx.getSession() as DbSession).get(this.distinctName);
		if (o instanceof Promise) 
			return o.then((r: NamedObject)=>this.cached = r)
				.catch((e: any)=>{
					if (e instanceof NotFoundError)
						this.cached = null;
					return Promise.reject(e);
				});
		else
			return this.cached = o;	
	}
	

	// Executes function with the object. Returns f()'s return value, either directly or in Promise
	with<T>(ctx: Context, f: (obj: NamedObject)=>T): Promise<T> | T {
		if (this.cached != null)
			return f(this.cached);
		else if (this.cached === null)
			return Promise.reject(new NotFoundError(this.distinctName));

		const o = (ctx.getSession() as DbSession).get(this.distinctName);
		if (o instanceof Promise) 
			return o.catch((e: any)=>{
					if (e instanceof NotFoundError)
						this.cached = null;
					return Promise.reject(e);
				})
			.then((r: NamedObject)=>f(this.cached = r));
		else
			return f(this.cached = o);
	}

	// Retrieves a single member from the object and calls the callback function with it. 
	withMember<T>(ctx: Context, name: string, f: (v: any)=>T): Promise<T> | T {
		return this.with(ctx, o=>o.withMember(ctx, name, f)) as Promise<T> | T;
	}

	
	hasSameParameters(right: DbRef): boolean {
		if (!this.parameters != !right.parameters)
			return false;
		if (!this.parameters || !right.parameters)
			return true;
		if (this.parameters.size != right.parameters.size)
			return false;
		for (let a in this.parameters.keys())
			if ((!right.parameters.has(a)) || this.parameters.get(a) !== right.parameters.get(a))
				return false;
		return true;
	}

	private memberInternal(ctx: Context, obj: NamedObject | null, name: string, parameters?: Map<string, any>): any {
		if (obj === null)
			return null;
		else if (parameters && this.parameters)
			return obj.member(ctx, name, new Map([...this.parameters, ...parameters]) as any);
		else if (parameters)
			return obj.member(ctx, name, parameters);
		else
			return obj.member(ctx, name, this.parameters);
	}

	// Returns the member value with the given name, possibly wrapped in a Promise
	member(ctx: Context, name: string, parameters?: Map<string, any>): Promise<any> | any {
		return this.with(ctx, (o: NamedObject) =>this.memberInternal(ctx, o, name, parameters));
	}
	
	op(ctx: Context, operator: string, right: any): any {
		if (right instanceof DbRef) {
			switch(operator) {
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
	
	getAsync(ctx: Context): Promise<NamedObject|null> {
		const v = this.get(ctx);
		if (v instanceof Promise)
			return v;
		else
			return Promise.resolve(v);
	}

	// returns either NamedObject or Promise!
	getFromDb(ctx: Context): NamedObject | Promise<NamedObject> {
		if (this.cached != null)
			return this.cached;
		else if (this.cached === null)
			return Promise.reject(new NotFoundError(this.distinctName));
		else
			return (ctx.getSession() as DbSession).getFromDatabase(this.distinctName);
	}
	
	get isAvailable(): boolean {
		return this.cached !== undefined;
	}
	
  getSerializationProperties(): any[] {		
    return this.parameters ? [this.distinctName, this.parameters] : [this.distinctName];
  }	
		
	serializeToString(pretty: boolean, indent: number, spaces: string) : string | undefined {
		return this.parameters ? undefined : '@'+this.distinctName;
	}
	
  static toPromise(ctx: Context, ref: DbRef | NamedObject): Promise<NamedObject | null> {
		return Promise.resolve(ref instanceof DbRef ? ref.get(ctx) : ref);
	}
  
	static create_jel_mapping = {distinctName: 1, dbEntry: 2, parameters: 3};
	static create(ctx: Context, ...args: any[]): any {
		if (args[0] instanceof DbRef)
			return args[0];
		return new DbRef(args[0], args[1]);
	}
}


