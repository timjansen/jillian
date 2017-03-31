/* 
 * Parser for JEL
 */

'use strict';

const tokenizer = require('tokenizer.js');

const binaryOperators = {
  '=': 10,
  '<': 11,
  '>': 11,
  '>=': 11,
  '<=': 11,
  '!=': 10,
  '==': 10,
  '<<': 11,
  '>>': 11,
  '>==': 11,
  '<==': 11,
  '!==': 10,
  '&&': 6,
  '||': 5,
  'instanceof': 16,
  'derivativeof': 16,
  '+': 13,
  '-': 13,
  '*': 14,
  '/': 14,
  '%': 14,

  'map': 16,
  'filter': 16,
  'collect': 16,
  'sort': 16,
  'at': 16,
  'skip': 16,
  'truncate': 16,
};
const unaryOperators = {
  '-': 16,
  '!': 16,
  'abs': 16,
  'count': 16,
  'exists': 16,
  'max': 16,
  'min': 16,
  'avg': 16,
  'same': 16,
  'first': 16
};

const DEFAULT_STOP = {};
const PARENS_STOP = {')': true};
const IF_STOP = {'then': true, 'else': true};
const THEN_STOP = {'else': true};

// special cases:: parens, calls, members/relationships, references, if/then/else, => (lambda), with

const parser = {
  parse(input) {
    return parser.parseExpression(tokenizer.tokenize(input));
  },
  
  parseExpression(tokens, precedence = 1, stopOps = DEFAULT_STOP) {
    const token = tokens.next();
    if (!token) 
      throw "Unexpected end, expected another token";
    if (token.type)
      return parser.tryBinaryOps(token, tokens, precedence, stopOps);
    if (token.identifier) {
      // todo: check for lambda a=>x here
      return parser.tryBinaryOps({type: 'variable', name: token.value}, tokens, precedence, stopOps);
    }
    if (token.operator) {
      const unOp = unaryOperators[token.value];
      if (unOp) {
        const operand = parser.parseExpression(tokens, unOp, DEFAULT_STOP);
        return parser.tryBinaryOps({type: 'operator', operator: token.value, operand: operand}, tokens, precedence, stopOps);
      }
      else if (token.value == '(') {
        // todo (grouping, method, lambda])
      }
      else if (token.value == '@') {
        let t2 = tokens.next();
        if (!t2 || !t2.identifier)
          throw "Expected identifier after '@' for reference, but got " + token;
        return parser.tryBinaryOps({type: 'reference', name: t2.value}, tokens, precedence, stopOps);
      }
      else if (token.value == 'if') {
        let cond = parser.parseExpression(tokens, 4, IF_STOP), thenV, elseV;
        let t2 = tokens.next();
        if (!t2 || !t2.operator || (t2.value != 'then' && t2.value != 'else'))
          throw "Expected 'else' or 'then' after 'if' condition, but got " + token;
        if (t2.value == 'then') {
          thenV = parser.parseExpression(tokens, 4, IF_STOP);
        }
        let t3 = tokens.next();
        if (!t3 || !t3.operator || t3.value != 'else')
          throw "Expected 'else' after 'if'/'then' condition, but got " + token;
        elseV = parser.parseExpression(tokens, 4, THEN_STOP);
        return parser.tryBinaryOps({type: 'condition', condition: cond, then: thenV, else: elseV}, tokens, precedence, stopOps);

      }
      else if (token.value == 'with') {
        // todo
      }
  }
    throw "Unexpected token: " + token;
  },
    
  tryBinaryOps(left, tokens, startAt, precedence, stopOps) {
    
  }
  
};

exports.parser = parser;