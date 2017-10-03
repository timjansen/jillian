
export const enum TokenType {
	Operator = 1, 
	Literal,
	Identifier,
	Pattern,
		
	Word = 20,
	Template,
	RegExp
}

export class Token {
	constructor(public type: TokenType, public value: string | undefined) {
	}
}

export class LiteralToken extends Token {
	constructor(public literal: any) {
		super(TokenType.Literal, undefined);
	}

	
}

export class PatternToken extends Token {
	constructor(name: string | undefined, public template: string, public metaFilter: Set<string>, public expression: string | undefined) {
		super(TokenType.Template, name);
	}
	
	get name() {
		return this.value;
	}
}

export class RegExpToken extends Token {
	hints: string;
	constructor(name: string | undefined, public regexps: string[], public expression: string | undefined) {
		super(TokenType.Template, name);
	}
	
	get name() {
		return this.value;
	}
}

