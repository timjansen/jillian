/*
Tokenizes a JEL input string.

*/
'use strict';

const TokenReader = require('./tokenreader.js');

const wordOperators = {'instanceof': 1, derivativeof: 1, 'if': 1, 'then': 1, 'else': 1, with: 1};
const constants = {'null': null, 'true': true, 'false': false};
const escapes = {n: '\n', t: '\t'};

//                          name:                   templateName        .hint.hint              expression
const patternTemplateRE = /^\s*(?:([a-zA-Z_$][\w_$]*):)?\s*([a-zA-Z_$][\w_$]*)(?:\.(\w+(?:\.\w+)*))?\s*(?:::\s*(.*))?$/;


class Tokenizer {
  static tokenize(input) {
    //          line comment   full comment                 Number                        Operator                                                                        Identifier-like     pattern           single-quoted    double-quoted        illegal
    const re = /\/\/.*(?:\n|$)|\/\*(?:[^\*]+|\*+[^\/])*\*\/|(\d+(?:\.\d+)?(?:e[+-]?\d+)?)|([\(\)\[\]\{\}:\.,\+\-\*\/%@]|=>|===|==|=|<==|>==|>=|<=|>|<|!==|!=|!|\|\||\&\&)|([a-zA-Z_$][\w_$]*)|(`(?:\\.|[^`])*`)|('(?:\\.|[^'])*'|"(?:\\.|[^"])*")|\s+|(.+)/g;
    // groups:
    // group 1: number
    // group 2: operator
    // group 3: identifier
    // group 4: quoted string
    // group 5: illegal char
    
    let matches, tokensLeft = 10000;
    const tokens = [];
    while ((matches = re.exec(input)) && tokensLeft--) {
      if (matches[2])
        tokens.push({value: matches[2], operator: true});
      else if (matches[3] && matches[3] in constants)
        tokens.push({value: constants[matches[3]], literal: true});
      else if (matches[3] && matches[3] in wordOperators)
        tokens.push({value: matches[3], operator: true});
      else if (matches[3])
        tokens.push({value: matches[3], identifier: true}); 
      else if (matches[1])
        tokens.push({value: parseFloat(matches[1]), literal: true});
      else if (matches[4])
        tokens.push({value: matches[4].replace(/^.|.$/g, ''), pattern: true});
      else if (matches[5])
        tokens.push({value: matches[5].replace(/^.|.$/g, '').replace(/\\(.)/g, (m,c)=>escapes[c]||c), literal: true});
      else if (matches[6])
        throw new Error(`Unsupported token found: "${matches[6]}"`);
    }
    return new TokenReader(tokens);
  } 
  
  
  static tokenizePattern(pattern) {
		//          simple word              choice ops      template
		const re = /\s*(?:([^\s\[\{\|\[\]]+)|(\[|\]\?|\]|\|)|\{\{((?:[^}]|\}[^}])+)\}\}|(.*))\s*/g;
		
		let m, tokensLeft = 10000;
    const tokens = [];
    while ((m = re.exec(pattern)) && tokensLeft--) {
			if (m[1] != null)
				tokens.push({word: m[1]});
			else if (m[2] != null)
				tokens.push({op: m[2]});
			else if (m[3] != null)
				tokens.push(Tokenizer.parsePatternTemplate(m[3]));
			else if (m[4])
        throw new Error(`Unsupported token found in pattern: "${m[4]}"`);
    }
    return new TokenReader(tokens);
	}

	static parsePatternTemplate(tpl) {
		const m = patternTemplateRE.exec(tpl);
		if (!m)
			throw new Error(`Can not parse pattern template: {{${tpl}}}`);
		return {name: m[1], template: m[2], hints: m[3] ? m[3].split('.') : [], expression: m[4]};
	}
}

module.exports = Tokenizer;
