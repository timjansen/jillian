import Context from './Context';

/**
 * An interface for DbRef to implement, so the serializer can recognize is.
 */
export interface IDbRef {
	isIDBRef: boolean;
	distinctName: string;
	
	with(ctx: Context, f: (obj: any)=>any): Promise<any> | any;
	get(ctx: Context): Promise<any> | any;
}

export interface IDbSession {
	createDbRef(distinctName: string): any;	
}

/**
 * Checks whether the given reference is an IDbRef.
 */
export function isDbRef(obj: any): obj is IDbRef {
	return 'isDBRef' in obj;
}


