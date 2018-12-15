import {Token, TokenType} from './Token';

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

 	peekIs(type: TokenType, value?: any, offset=0): Token|undefined {
		const t = this.tokens[this.startPos+offset];
    return (t && t.is(type, value)) ? t : undefined;
	}

 	nextIf(type: TokenType, value?: any, offset=0): Token|undefined {
		const t = this.peekIs(type, value, offset);
    if(t)
      this.startPos+=offset+1;
    return t;
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
