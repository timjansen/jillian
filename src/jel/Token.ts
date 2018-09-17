
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
	constructor(public line: number, public column: number, public type: TokenType, public value: any) {
	}
}

export class TemplateToken extends Token {
	constructor(line: number, column: number, name: string | undefined, public template: string, public metaFilter: Set<string>, public expression?: string) {
		super(line, column, TokenType.Template, name);
	}
	
	get name() {
		return this.value;
	}
}

export class RegExpToken extends Token {
	hints: string;
	constructor(line: number, column: number, name: string | undefined, public regexps: string[], public expression?: string) {
		super(line, column, TokenType.RegExp, name);
	}
	
	get name() {
		return this.value;
	}
}

