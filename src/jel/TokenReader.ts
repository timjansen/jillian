import {Token} from './Token';

export default class TokenReader {
	constructor(public tokens: Token[], public startPos = 0) {
	}
	
	hasNext(count=1): boolean {
		return !!this.tokens[this.startPos+count-1];
	}
	
  next(): Token {
		return this.tokens[this.startPos++];
	}
  
	peek(offset=0): Token {
		return this.tokens[this.startPos+offset];
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
