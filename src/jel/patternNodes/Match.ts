import JelObject from '../JelObject';

const EMPTY_MAP = new Map();

// A match returned by a LamdaResultNode
export default class Match extends JelObject {
	// value: the return value
	// index: the position after the match in the string array
	// meta: a string->value map of additional meta data
	constructor(public value: any, public index: number, public meta: Map<string, any> = EMPTY_MAP) {
		super();
	}
	
	JEL_PROPERTIES = {value: true, meta: true};
}

