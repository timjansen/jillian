
export const enum TokenType {
	Operator = 1,        // for JEL expressions
	Literal,
	Identifier,
	Pattern,
	Fraction,
  TemplateString,
		
	Word = 20,           // for patterns
	Template,
	RegExp,
    
  StringFragment = 40, // for template strings
  Expression
}

export class Token {
	constructor(public line: number, public column: number, public type: TokenType, public value: any) {
	}
	
  is(type: TokenType, value?: any): Token|undefined {
    return (this.type == type && (value == null || this.value == value)) ? this : undefined;
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

