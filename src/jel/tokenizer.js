/*
Tokenizes a JEL input string.

*/
'use strict';

const wordOperators = {'instanceof': 1, derivativeof: 1, 'if': 1, 'then': 1, 'else': 1, with: 1};
const constants = {'null': null, 'true': true, 'false': false};

const jelTokenizer = {
  tokenize(input) {
    //          Number                        Operator                                                                                              Identifier-like     back-quoted      single-quoted   double-quoted        illegal
    const re = /(\d+(?:\.\d+)?(?:e[+-]?\d+)?)|(\(|\)|\[|\]|\{|\}|\.\*|:|\.|,|\+|-|\*|\/|%|@|=>|==|<==|>==|!==|<<|>>|===|=|!=|>=|<=|>|<|!|\|\||\&\&)|([a-zA-Z_$][\w_$]*)|(`(?:\\.|[^`])*`|'(?:\\.|[^'])*'|"(?:\\.|[^"])*")|\s+|(.+)/g;
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
        tokens.push({value: matches[4].replace(/^.|.$/g, ''), literal: true});
      else if (matches[5])
        throw new Error(`Unsupported token found: "${matches[5]}"`);
    }
    return {tokens, 
            i: 0, 
            next() {return tokens[this.i++];}, 
            peek() {return tokens[this.i];},
            last() {return tokens[this.i-1];},
            copy() {return {tokens, i: this.i, next: this.next, peek: this.peek, copy: this.copy, set: this.set, last: this.last};}
    };
  }, 


};

module.exports = jelTokenizer;
