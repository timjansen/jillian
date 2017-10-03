import {Token} from './Token';

export default class TokenReader {
	constructor(public tokens: Token[], public startPos = 0) {
	}
	
  next(): Token | undefined {
		return this.tokens[this.startPos++];
	} 
  
	peek(): Token | undefined {
		return this.tokens[this.startPos];
	}
		
	last(): Token | undefined {
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
