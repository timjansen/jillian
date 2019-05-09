import JelObject from './JelObject';

export default class ScriptException extends Error {
	constructor(public exception: JelObject) {
		super(exception.toString());
	}
}

