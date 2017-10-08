import {Token} from './Token';

export default class TokenReader {
	constructor(public tokens: Token[], public startPos = 0) {
	}
	
	hasNext(): boolean {
		return !!this.tokens[this.startPos];
	}
	
  next(): Token {
		return this.tokens[this.startPos++];
	}
  
	peek(): Token {
		return this.tokens[this.startPos];
	}
		
	last(): Token {
		return this.tokens[this.startPos-1];
	}
	
	copy(): TokenReader {
		return new TokenReader(this.tokens, this.startPos); 
	}

	undo(): void {
		this.startPos--;
	}

	static copyInto(from: TokenReader, to: TokenReader): void {
		to.tokens = from.tokens;
		to.startPos = from.startPos;
	}
}
