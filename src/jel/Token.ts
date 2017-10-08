
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
	constructor(public type: TokenType, public value: any) {
	}
}

export class TemplateToken extends Token {
	constructor(name: string | undefined, public template: string, public metaFilter: Set<string>, public expression?: string) {
		super(TokenType.Template, name);
	}
	
	get name() {
		return this.value;
	}
}

export class RegExpToken extends Token {
	hints: string;
	constructor(name: string | undefined, public regexps: string[], public expression?: string) {
		super(TokenType.RegExp, name);
	}
	
	get name() {
		return this.value;
	}
}

