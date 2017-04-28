/* 
 * Parser and Interpreter for JEL
 */

'use strict';

const tokenizer = require('./tokenizer.js');

const binaryOperators = { // op->precedence
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
const unaryOperators = { // op->precedence
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

const IF_PRECEDENCE = 4; 
const PARENS_PRECEDENCE = 4; 

const NO_STOP = {};
const PARENS_STOP = {')': true};
const PARAMETER_STOP = {')': true, ',': true};
const IF_STOP = {'then': true, 'else': true};
const THEN_STOP = {'else': true};
const WITH_STOP = {':': true, ',': true};

class JEL {
  constructor(input) {
    this.tokens = tokenizer.tokenize(input);
    this.parseTree = this.parseExpression();
  }
  
  throwParseException(token, msg) {
    throw new Error(msg + '\n' + token ? JSON.stringify(token) : '');
  }
  
  parseExpression(precedence = 0, stopOps = NO_STOP) {
    const token = this.tokens.next();
    if (!token) 
      this.throwParseException(token, "Unexpected end, expected another token");
    if (token.type) // if type is set, tokenizer resolved it already: it's a literal.
      return this.tryBinaryOps(token, precedence, stopOps);
    if (token.identifier) {
      const lambda = this.tryLambda(token.value, precedence, stopOps);
      return this.tryBinaryOps(lambda || {type: 'variable', name: token.value}, precedence, stopOps);
    }
    if (token.operator) {
      const unOp = unaryOperators[token.value];
      if (unOp) {
        const operand = this.parseExpression(unOp, NO_STOP);
        return this.tryBinaryOps({type: 'operator', operator: token.value, operand: operand}, precedence, stopOps);
      }
      else if (token.value == '(') {
        const lambda = this.tryLambda(null, precedence, stopOps);
        if (lambda)
          return this.tryBinaryOps(lambda, precedence, stopOps);
        else
          return this.parseExpression(PARENS_PRECEDENCE, PARENS_STOP);
      }
      else if (token.value == '@') {
        let t2 = this.tokens.next();
        if (!t2 || !t2.identifier)
          this.throwParseException(token, "Expected identifier after '@' for reference.");
        return this.tryBinaryOps({type: 'reference', name: t2.value}, precedence, stopOps);
      }
      else if (token.value == 'if') {
        let cond = this.parseExpression(IF_PRECEDENCE, IF_STOP), thenV, elseV;
        let t2 = this.tokens.next();
        if (!t2 || !t2.operator || !IF_STOP[t2.value])
          this.throwParseException(t2 || token, "Expected 'else' or 'then' after 'if' condition.");
        if (t2.value == 'then') {
          thenV = this.parseExpression(IF_PRECEDENCE, IF_STOP);
        }
        let t3 = this.tokens.next();
        if (!t3 || !t3.operator || t3.value != 'else')
          this.throwParseException(t3 || token, "Expected 'else' after 'if'/'then' condition.");
        elseV = this.parseExpression(IF_PRECEDENCE, THEN_STOP);
        return this.tryBinaryOps({type: 'condition', condition: cond, then: thenV, else: elseV}, precedence, stopOps);

      }
      else if (token.value == 'with') {
        const assignments = [];
        while (true) {
          const name = this.tokens.next();
          if (!name || !name.identifier)
            this.throwParseException(name || token, "Expected identifier for variable.");
          const eq = this.tokens.next();
          if (!eq || !eq.operator || eq.value != '=')
            this.throwParseException(eq || name, "Expected equals sign after variable name.");
          const expression = this.parseExpression(precedence, WITH_STOP);
          if (!expression)
            this.throwParseException(eq, "Expression ended unexpectedly.");
          assignments.push({name, expression});
          const terminator = this.tokens.next();
          if (!terminator || !terminator.operator || !WITH_STOP[terminator.value])
            this.throwParseException(terminator|| expression, "Expected comma or colon after expression in 'with' statement.");
          if (terminator.value == ':')
            break;
        }
        return {type: 'with', assignments, expression: this.parseExpression(precedence, stopOps)};
      }
    }
    this.throwParseException(token, "Unexpected token");
  }
   
  // called after an potential left operand for a binary op
  tryBinaryOps(left, precedence, stopOps) {
    const binOpToken = this.tokens.peek();
    if (!binOpToken)
      return left;
    
    if (binOpToken.operator && stopOps[binOpToken.value]) 
      return this.tokens.next() && left;
    
    const opPrecedence = binaryOperators[binOpToken.value];
    if (!opPrecedence)
      this.throwParseException(binOpToken, "Unexpected token");
    
    if (opPrecedence <= precedence)
      return left;
    
    this.tokens.next();
    return this.tryBinaryOps({type: 'operator', operator: binOpToken.value, left, right: this.parseExpression(binaryOperators[binOpToken.value], stopOps)}, precedence, stopOps);
  }
  
  tryLambda(argName, precedence, stopOps) {
    let args;
    if (argName) {
      const ld = this.tokens.peek();
      if (!ld || !ld.operator || ld.value != '=>')
        return null;
      args = [argName];
    }
    else {
      var tok = this.tokens.copy();
      args = [];
      while (true) {
        const name = tok.next();
        if (!name || !name.identifier)
          return null;
        args.push(name.value);
        const terminator = tok.next();
        if (!terminator || !terminator.operator || !PARAMETER_STOP[terminator.value])
          return null;
        if (terminator.value == ')')
          break;
      }  
      const ld = tok.next();
      if (!ld || !ld.operator || ld.value != '=>')
        return null;
      this.tokens = tok;
      return {type: 'lambda', args, expression: this.parseExpression(precedence, stopOps)};
    }

  }
  
}

module.exports = JEL;