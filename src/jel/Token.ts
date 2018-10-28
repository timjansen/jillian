
export const enum TokenType {
	Operator = 1, 
	Literal,
	Identifier,
	Pattern,
	Fraction,
		
	Word = 20,
	Template,
	RegExp
}

export class Token {
	constructor(public line: number, public column: number, public type: TokenType, public value: any) {
	}
	
	toString(): string {
		return `Token(line=${this.line} column=${this.column} type=${this.type} value=${this.value})`;
	}
}

export class TemplateToken extends Token {
	constructor(line: number, column: number, name: string | undefined, public template: string, public metaFilter: Set<string>, public expression?: string) {
		super(line, column, TokenType.Template, name);
	}
	
	get name() {
		return this.value;
	}

	toString(): string {
		return `TemplateToken(line=${this.line} column=${this.column} type=${this.type} value=${this.value} template=${this.template} expression=${this.expression})`;
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

	toString(): string {
		return `RegExpToken(line=${this.line} column=${this.column} type=${this.type} value=${this.value} regexps=${this.regexps.join(', ')} expression=${this.expression})`;
	}
}

export class FractionToken extends Token {
	constructor(line: number, column: number, public numerator: number, public denominator: number) {
		super(line, column, TokenType.Fraction, numerator/denominator);
	}
}

