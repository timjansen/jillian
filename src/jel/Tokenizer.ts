/*
Tokenizes a JEL input string.

*/

import Util from '../util/Util';
import TokenReader from './TokenReader';
import {TokenType, Token, TemplateToken, RegExpToken} from './Token';

const wordOperators: any = {'instanceof': true, 'derivativeof': true, 'if': true, 'then': true, 'else': true, 'with': true, 'abs': true};
const constants: any = {'null': null, 'true': true, 'false': false};
const escapes: any = {n: '\n', t: '\t'};

//                          name:                          templateName       .hint.hint               expression
const patternTemplateRE = /^\s*(?:([a-zA-Z_$][\w_$]*):)?\s*([a-zA-Z_$][\w_$]*)(?:\.(\w+(?:\.\w+)*))?\s*(?:::\s*(.*))?$/;

// pattern regexp               name:                    regexps                        expression
const patternRegexpRE = /^\s*(?:([a-zA-Z_$][\w_$]*):)?\s*((?:\/(?:\\.|[^\/])+\/\s*)+)(?:::\s*(.*))?$/;

// to find regexps in the regexp patten
const patternRegexpFinderRE = /\/(?:\\.|[^\/])+\//g;


export default class Tokenizer {
	static unescape(s: string): string {
		return s.replace(/\\(.)/g, (m,c)=>escapes[c]||c);
	}
	
  static tokenize(input: string): TokenReader {
    //          line comment   full comment                 Number                        Operator                                                                                     Identifier-like     pattern           single-quoted    double-quoted        illegal
    const re = /\/\/.*(?:\n|$)|\/\*(?:[^\*]+|\*+[^\/])*\*\/|(\d+(?:\.\d+)?(?:e[+-]?\d+)?)|([\(\)\[\]:\.,\+\-\*\/%@]|\$\{|\{|\}|=>|===|==|=|<<=|>>=|>=|<=|>>|<<|>|<|!==|!=|!|\|\||\&\&)|([a-zA-Z_$][\w_$]*)|(`(?:\\.|[^`])*`)|('(?:\\.|[^'])*'|"(?:\\.|[^"])*")|\s+|(.+)/g;
    // groups:
    // group 1: number
    // group 2: operator
    // group 3: identifier
    // group 4: pattern
    // group 5: quoted string
    // group 6: illegal char
    
    let matches, tokensLeft = 10000;
    const tokens: Token[] = [];
    while ((matches = re.exec(input)) && tokensLeft--) {
      if (matches[2])
        tokens.push(new Token(TokenType.Operator, matches[2]));
      else if (matches[3] && matches[3] in constants)
        tokens.push(new Token(TokenType.Literal, constants[matches[3]]));
      else if (matches[3] && matches[3] in wordOperators)
        tokens.push(new Token(TokenType.Operator, matches[3]));
      else if (matches[3])
        tokens.push(new Token(TokenType.Identifier, matches[3])); 
      else if (matches[1])
        tokens.push(new Token(TokenType.Literal, parseFloat(matches[1])));
      else if (matches[4])
        tokens.push(new Token(TokenType.Pattern, Tokenizer.unescape(matches[4].replace(/^.|.$/g, ''))));
      else if (matches[5])
        tokens.push(new Token(TokenType.Literal, Tokenizer.unescape(matches[5].replace(/^.|.$/g, ''))));
      else if (matches[6])
        throw new Error(`Unsupported token found: "${matches[6]}"`);
    }
    return new TokenReader(tokens);
  } 
  
  
  static tokenizePattern(pattern: string): TokenReader {
		//          simple word              choice ops      template
		const re = /\s*(?:([^\s\[\{\|\[\]]+)|(\[|\]\?|\]|\|)|\{\{((?:[^}]|\}[^}])+)\}\}|(.*))\s*/g;
		
		let m, tokensLeft = 10000;
    const tokens: Token[] = [];
    while ((m = re.exec(pattern)) && tokensLeft--) {
			if (m[1] != null)
				tokens.push(new Token(TokenType.Word, m[1]));
			else if (m[2] != null)
				tokens.push(new Token(TokenType.Operator, m[2]));
			else if (m[3] != null)
				tokens.push(Tokenizer.parsePatternTemplate(m[3]));
			else if (m[4])
        throw new Error(`Unsupported token found in pattern: "${m[4]}"`);
    }
    return new TokenReader(tokens);
	}

	static parsePatternTemplate(tpl: string): Token {
		const m = patternTemplateRE.exec(tpl);
		if (m)
			return new TemplateToken(m[1], m[2], m[3] ? new Set(m[3].split('.')) : new Set(), m[4]);

		const rm = patternRegexpRE.exec(tpl)
		if (rm)
			return new RegExpToken(rm[1], 
														 rm[2].match(patternRegexpFinderRE)!.map(r=>Tokenizer.unescape(r).replace(/^.|.$/g, '')), 
														 rm[3]);

		throw new Error(`Can not parse pattern template: {{${tpl}}}`);
	}
}

