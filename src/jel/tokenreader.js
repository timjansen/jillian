'use strict'

class TokenReader {
	constructor(tokens, startPos = 0) {
		this.tokens = tokens;
		this.i = startPos;
	}
	
  next() {
		return this.tokens[this.i++];
	} 
  
	peek() {
		return this.tokens[this.i];
	}
		
	last() {
		return this.tokens[this.i-1];
	}
	
	copy() {
		return new TokenReader(this.tokens, this.i); 
	}

	undo() {
		this.i--;
	}

	static copyInto(from, to) {
		to.tokens = from.tokens;
		to.i = from.i;
	}
}

module.exports = TokenReader;