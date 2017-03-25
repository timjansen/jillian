/*
Tokenizes a JEL input string.



*/
'use strict';

const wordOperators = {and:1, or:1, xor:1, not:1, 'instanceof':1, derivativeof:1, abs: 1, count:1, exists:1, avg:1, max:1, min:1, same:1, first:1, map:1, filter:1, collect:1, sort:1,
                      'if':1, 'then': 1, 'else': 1, with: 1};
const constants = {'null': null, 'true':true, 'false': false};

var jelTokenizer = {
  tokenize(input) {
    //          Operator                                                                    Identifier-like    number                             back-quoted      single-quoted   double-quoted        illegal
    const re = /(\(|\)|\.>|\.\*|:|\.|,|\+|-|\*|\/|@|=>|==|<==|>==|!==|<<|>>|=|!=|>=|<=|>|<)|([a-zA-Z_$][\w_$]*)|([+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?)|(`(?:\\.|[^`])*`|'(?:\\.|[^'])*'|"(?:\\.|[^"])*")|\s+|(.+)/g;
    // groups:
    // group 1: operator
    // group 2: identifier
    // group 3: number
    // group 4: quoted string
    // group 5: illegal char
    
    let matches, tokensLeft = 2000;
    const output = [];
    while ((matches = re.exec(input)) && tokensLeft--) {
      if (matches[1])
        output.push({value: matches[1], operator: true});
      else if (matches[2] && matches[2] in constants)
        output.push({value: constants[matches[2]], literal: true});
      else if (matches[2] && matches[2] in wordOperators)
        output.push({value: matches[2], operator: true});
      else if (matches[2])
        output.push({value: matches[2], identifier: true});
      else if (matches[3])
        output.push({value: parseFloat(matches[3]), literal: true});
      else if (matches[4])
        output.push({value: matches[4].replace(/^.|.$/g, ''), literal: true});
      else if (matches[5])
        throw "Unsupported token found: " + matches[5];
    }
    return output;
  }, 


};

module.exports = jelTokenizer;
