
/**
 * An interface for DbRef to implement, so the serializer can recognize is.
 */
export interface IDbRef {
	isIDBRef: boolean;
	distinctName: string;
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


