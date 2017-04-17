/*
Tokenizes a JEL input string.



*/
'use strict';

const wordOperators = {and:1, or:1, xor:1, not:1, 'instanceof':1, derivativeof:1, abs: 1, count:1, exists:1, avg:1, max:1, min:1, same:1, first:1, map:1, filter:1, collect:1, sort:1,
                      'if':1, 'then': 1, 'else': 1, with: 1};
const constants = {'null': null, 'true': true, 'false': false};

const jelTokenizer = {
  tokenize(input) {
    //          Number                             Operator                                                                  Identifier-like     back-quoted      single-quoted   double-quoted        illegal
    const re = /([+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?)|(\(|\)|\.\*|:|\.|,|\+|-|\*|\/|@|=>|==|<==|>==|!==|<<|>>|=|!=|>=|<=|>|<|!)|([a-zA-Z_$][\w_$]*)|(`(?:\\.|[^`])*`|'(?:\\.|[^'])*'|"(?:\\.|[^"])*")|\s+|(.+)/g;
    // groups:
    // group 1: number
    // group 2: operator
    // group 3: identifier
    // group 4: quoted string
    // group 5: illegal char
    
    let matches, tokensLeft = 2000;
    const tokens = [];
    while ((matches = re.exec(input)) && tokensLeft--) {
      if (matches[2])
        tokens.push({value: matches[2], operator: true});
      else if (matches[3] && matches[3] in constants)
        tokens.push({value: constants[matches[3]], type: 'literal'});
      else if (matches[3] && matches[3] in wordOperators)
        tokens.push({value: matches[3], operator: true});
      else if (matches[3])
        tokens.push({value: matches[3], identifier: true});
      else if (matches[1])
        tokens.push({value: parseFloat(matches[1]), type: 'literal'});
      else if (matches[4])
        tokens.push({value: matches[4].replace(/^.|.$/g, ''), type: 'literal'});
      else if (matches[5])
        throw "Unsupported token found: " + matches[5];
    }
    return {tokens, 
            i: 0, 
            next() {return tokens[this.i++];}, 
            peek() {return tokens[this.i];}
    };
  }, 


};

module.exports = jelTokenizer;
