
export default class ChainableError extends Error {
	cause: Error | undefined;
	stack: string | undefined;
	
	constructor(causeOrMsg?: Error | string, public msg?: string) {
		super(typeof causeOrMsg == 'string' ? causeOrMsg : msg);
		if (causeOrMsg === undefined || typeof causeOrMsg == 'string') {
			(Error as any).captureStackTrace(this, ChainableError);
		}
		else {
			(Error as any).captureStackTrace(this, ChainableError);
			this.cause = causeOrMsg;
			this.redoStack();
		}
	}
	
	redoStack() {
		if (this.cause)
			this.stack = `${this.stack} \n\ncaused by ${this.cause.stack}`;
	}
	
}
