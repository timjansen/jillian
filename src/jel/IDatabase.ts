import Context from './Context';


export interface IDbEntry {
	isIDBEntry: boolean;
	distinctName: string;
	member(ctx: Context, name: string, parameters?: Map<string, any>): any;
	withMember<T>(ctx: Context, name: string, f: (value: any)=>T): T | Promise<T>;
}


/**
 * An interface for DbRef to implement, so the serializer can recognize it.
 */
export interface IDbRef {
	isIDBRef: boolean;
	distinctName: string;
	
	with<T>(ctx: Context, f: (obj: IDbEntry)=>T): Promise<T> | T;
	withMember<T>(ctx: Context, name: string, f: (v: any)=>T): Promise<T> | T;
	get(ctx: Context): Promise<IDbEntry> | IDbEntry;
	member(ctx: Context, name: string, parameters?: Map<string, any>): Promise<any> | any;
}

export interface IDbSession {
	createDbRef(distinctName: string, parameters?: Map<string, any>): any;

	get(distinctName: string): IDbEntry | Promise<IDbEntry>;
  getMember(distinctName: string, property: string): Promise<any> | any;

	with<T>(distinctName: string, f: (obj: IDbEntry)=>T): Promise<T> | T;
	withMember<T>(distinctName: string, name: string, f: (v: any)=>T): Promise<T> | T;
}
	
/**
 * Checks whether the given reference is an IDbRef.
 */
export function isDbRef(obj: any): obj is IDbRef {
	return 'isDBRef' in obj;
}


