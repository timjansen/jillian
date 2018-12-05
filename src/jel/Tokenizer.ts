/*
Tokenizes a JEL input string.

*/

import Util from '../util/Util';
import TokenReader from './TokenReader';
import {TokenType, Token, TemplateToken, RegExpToken, FractionToken} from './Token';

const wordOperators: any = new Set(['instanceof', 'if', 'then', 'else', 'with']);
const constantMapping: any = {'null': null, 'true': true, 'false': false};
const constants: any = new Map(Object.keys(constantMapping).map(x=>[x, constantMapping[x]]) as any);

//                          name:                          templateName       .hint.hint               expression
const patternTemplateRE = /^\s*(?:([a-zA-Z_$][\w_$]*):)?\s*([a-zA-Z_$][\w_$]*)(?:\.(\w+(?:\.\w+)*))?\s*(?:::\s*(.*))?$/;

// pattern regexp               name:                    regexps                        expression
const patternRegexpRE = /^\s*(?:([a-zA-Z_$][\w_$]*):)?\s*((?:\/(?:\\.|[^\/])+\/\s*)+)(?:::\s*(.*))?$/;

// to find regexps in the regexp patten
const patternRegexpFinderRE = /\/(?:\\.|[^\/])+\//g;

// to parse a fraction
const fractionRE = /^(\d+)\s*\/\s*(\d+)$/;

export default class Tokenizer {
	static unescape(s: string): string {
		return s.replace(/\\(.)/g, (m,c)=>c == 'n' ? '\n': c == 't' ? '\t' : c);
	}
	
  static tokenize(input: string): TokenReader {
    //          line comment   full comment                | Fraction                       |Number                        Operator                                                                                                           Identifier-like                    pattern           single-quoted    double-quoted        illegal
    const re = /\/\/.*(?:\n|$)|\/\*(?:[^\*]+|\*+[^\/])*\*\/|(\d+\s*\/\s*[1-9]\d*(?![e.0-9]))|(\d+(?:\.\d+)?(?:e[+-]?\d+)?)|([\(\)\]\}:\.,\*\/^%@]|\+-|\+|-|\{\}|\[\]|\$\{|\{|\[|=>|===|==|=|<<=|>>=|>=|<=|>>|<<|>|<|!==|!=|!|\|\||\&\&|\||\?)|([a-zA-Z_](?:[\w_]|\:\:[a-zA-Z])*)|(`(?:\\.|[^`])*`)|('(?:\\.|[^'])*'|"(?:\\.|[^"])*")|\s+|(.+)/g;
    // groups:
    // group 1: fraction
    // group 2: number
    // group 3: operator
    // group 5: identifier
    // group 5: pattern
    // group 6: quoted string
    // group 7: illegal char
    
		const lineNumbers: number[] = [];
		let pos = -1;
		while (pos <= input.length) {
			pos = input.indexOf('\n', pos + 1);
			if (pos < 0)
				break;
			lineNumbers.push(pos);
		}
		lineNumbers.push(input.length);
		
    let matches, tokensLeft = 10000, line = 1;
    const tokens: Token[] = [];
    while ((matches = re.exec(input)) && tokensLeft--) {
			const index = matches.index;
			while (lineNumbers[line-1] < index)
				line++;
			const col = index - ((line > 1) ? lineNumbers[line-2] : -1);
			
      if (matches[3])
        tokens.push(new Token(line, col, TokenType.Operator, matches[3]));
      else if (matches[4] && constants.has(matches[4]))
        tokens.push(new Token(line, col, TokenType.Literal, constants.get(matches[4])));
      else if (matches[4] && wordOperators.has(matches[4]))
        tokens.push(new Token(line, col, TokenType.Operator, matches[4]));
      else if (matches[4])
        tokens.push(new Token(line, col, TokenType.Identifier, matches[4])); 
      else if (matches[2])
        tokens.push(new Token(line, col, TokenType.Literal, parseFloat(matches[2])));
      else if (matches[5])
        tokens.push(new Token(line, col, TokenType.Pattern, Tokenizer.unescape(matches[5].replace(/^.|.$/g, ''))));
      else if (matches[6])
        tokens.push(new Token(line, col, TokenType.Literal, Tokenizer.unescape(matches[6].replace(/^.|.$/g, ''))));
      else if (matches[7])
        throw new Error(`Unsupported token found at line ${line}, column ${col}: "${matches[7]}"`);
      else if (matches[1]) {
				const fractionMatch = fractionRE.exec(matches[1]);
				if (!fractionMatch)
					throw new Error(`Unsupported token found at line ${line}, column ${col}: "${matches[1]}"`);
        tokens.push(new FractionToken(line, col, parseInt(fractionMatch[1]), parseInt(fractionMatch[2])));
			}
    }
		if (tokensLeft < 1)
			throw new Error('Input too large for tokenizer');
    return new TokenReader(tokens);
  } 
  
  
  static tokenizePattern(line: number, column: number, pattern: string): TokenReader {
		//          simple word              choice ops      template
		const re = /\s*(?:([^\s\[\{\|\[\]]+)|(\[|\]\?|\]|\|)|\{\{((?:[^}]|\}[^}])+)\}\}|(.*))\s*/g;
		
		let m, tokensLeft = 10000;
    const tokens: Token[] = [];
    while ((m = re.exec(pattern)) && tokensLeft--) {
			if (m[1] != null)
				tokens.push(new Token(line, column, TokenType.Word, m[1]));
			else if (m[2] != null)
				tokens.push(new Token(line, column, TokenType.Operator, m[2]));
			else if (m[3] != null)
				tokens.push(Tokenizer.parsePatternTemplate(line, column, m[3]));
			else if (m[4])
        throw new Error(`Unsupported token found in pattern: "${m[4]}"`);
    }
    return new TokenReader(tokens);
	}

	static parsePatternTemplate(line: number, column: number, tpl: string): Token {
		const m = patternTemplateRE.exec(tpl);
		if (m)
			return new TemplateToken(line, column, m[1], m[2], m[3] ? new Set(m[3].split('.')) : new Set(), m[4]);

		const rm = patternRegexpRE.exec(tpl)
		if (rm)
			return new RegExpToken(line, column, rm[1], 
														 rm[2].match(patternRegexpFinderRE)!.map(r=>Tokenizer.unescape(r).replace(/^.|.$/g, '')), 
														 rm[3]);

		throw new Error(`Can not parse pattern template: {{${tpl}}}`);
	}
}

