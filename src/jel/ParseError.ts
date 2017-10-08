
import ChainableError from '../util/ChainableError';
import {Token} from './Token';

export default class ParseError extends ChainableError {

	constructor(cause?: Error, msg: string = "no error defined", public token?: Token) {
		super(cause, msg);
		(Error as any).captureStackTrace(this, ParseError);
		this.redoStack();
	}

	toString(): string {
		const base = this.msg + '\n' + (this.token ? JSON.stringify(this.token) : '(no token for reference)');
		if (this.cause instanceof ParseError)
			return base + '\n\n' + this.cause.toString;
		return base;
	}
	
	static rethrow(cause: Error, msg: string, token: Token) {
		if (cause instanceof ParseError)
			throw cause;
		throw new ParseError(cause, msg, token);
	}
}

