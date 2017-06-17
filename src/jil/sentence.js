'use strict';

const JelType = require('../jel/type.js');


class Sentence extends JelType {
	constructor(narrator, audience, tone, verb, clauses = []) {
		super();
	}
}

module.exports = Sentence;
