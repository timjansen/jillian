import ChainableError from '../util/ChainableError';

/**
 * Exception thrown if database object not found.
 */ 
export default class NotFoundError extends ChainableError {

	constructor(identifier: string) {
		super(`@${identifier} not found in database`);
		
		Error.captureStackTrace(this, NotFoundError);
	}
}

