/* 
 * Parser and Interpreter for JEL
 */

'use strict';

const tokenizer = require('./tokenizer.js');
const Context = require('./context.js');
const JelType = require('./type.js');
const JelNode = require('./node.js');
const Literal = require('./nodes/literal.js');
const Variable = require('./nodes/variable.js');
const Operator = require('./nodes/operator.js');
const List = require('./nodes/list.js');
const Reference = require('./nodes/reference.js');
const Condition = require('./nodes/condition.js');
const Assignment = require('./nodes/assignment.js');
const With = require('./nodes/with.js');
const Lambda = require('./nodes/lambda.js');
const Call = require('./nodes/call.js');

const binaryOperators = { // op->precedence
  '.': 19,
  '==': 10,
  '<': 11,
  '>': 11,
  '>=': 11,
  '<=': 11,
  '!=': 10,
  '===': 10,
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
  
  '(': 18,
  '[': 18
};
const unaryOperators = { // op->precedence
  '-': 16,
  '+': 16,
  '!': 16
};

const IF_PRECEDENCE = 4; 
const PARENS_PRECEDENCE = 4; 
const WITH_PRECEDENCE = 4; 

const NO_STOP = {};
const PARENS_STOP = {')': true};
const LIST_ENTRY_STOP = {']': true, ',': true};
const LIST_STOP = {']': true};
const PARAMETER_STOP = {')': true, ',': true};
const IF_STOP = {'then': true};
const THEN_STOP = {'else': true};
const WITH_STOP = {':': true, ',': true};
const EQUAL = {'=': true};

class JEL {
  constructor(input) {
    this.tokens = tokenizer.tokenize(input);
    this.parseTree = this.parseExpression();
  }
  
  execute(context = {}) {
    const ctx = (context instanceof Context) ? context : new Context(context);
    return this.parseTree.execute(ctx);
  }
  
  throwParseException(token, msg) {
    throw new Error(msg + '\n' + (token ? JSON.stringify(token) : '(no token for reference)'))
  }
  
  parseExpression(precedence = 0, stopOps = NO_STOP) {
    const token = this.tokens.next();
    if (!token) 
      this.throwParseException(token, "Unexpected end, expected another token");
    if (token.literal) 
      return this.tryBinaryOps(new Literal(token.value), precedence, stopOps);
    if (token.identifier) {
      const lambda = this.tryLambda(token.value, precedence, stopOps);
      return this.tryBinaryOps(lambda || new Variable(token.value), precedence, stopOps);
    }
    if (token.operator) {
      const unOp = unaryOperators[token.value];
      if (unOp) {
        if ((token.value == '-' || token.value == '+') && this.tokens.peek() && this.tokens.peek().literal) {
          const number = this.tokens.next();
          return this.tryBinaryOps(new Literal(token.value == '-' ? -number.value : number.value), precedence, stopOps);
        }
        const operand = this.parseExpression(unOp);
        return this.tryBinaryOps(new Operator(token.value, operand), precedence, stopOps);
      }
      else if (token.value == '(') {
        const lambda = this.tryLambda(null, precedence, stopOps);
        if (lambda)
          return this.tryBinaryOps(lambda, precedence, stopOps);
        else {
          const e = this.parseExpression(PARENS_PRECEDENCE, PARENS_STOP);
          this.expectOp(PARENS_STOP, "Expected closing parens");
          return this.tryBinaryOps(e, precedence, stopOps);
        }
      }
      else if (token.value == '[') {
        const possibleEOL = this.tokens.peek();
        if (!possibleEOL)
          this.throwParseException(token, "Unexpexted end, list not closed");
        if (possibleEOL.operator && possibleEOL.value == ']') {
          this.tokens.next();
          return this.tryBinaryOps(new List([]), precedence, stopOps);
        }

        const list = [];
        while (true) {
          list.push(this.parseExpression(PARENS_PRECEDENCE, LIST_ENTRY_STOP));
          if (this.expectOp(LIST_ENTRY_STOP, "Expecting comma or end of list").value == ']')
            return this.tryBinaryOps(new List(list), precedence, stopOps);
        }
      }
      else if (token.value == '@') {
        let t2 = this.tokens.next();
        if (!t2 || !t2.identifier)
          this.throwParseException(token, "Expected identifier after '@' for reference.");
        return this.tryBinaryOps(new Reference(t2.value), precedence, stopOps);
      }
      else if (token.value == 'if') {
        const cond = this.parseExpression(IF_PRECEDENCE, IF_STOP);
        this.expectOp(IF_STOP, "Expected 'then'");
        const thenV = this.parseExpression(IF_PRECEDENCE, THEN_STOP);
        this.expectOp(THEN_STOP, "Expected 'else' after 'if'/'then' condition.");
        return this.tryBinaryOps(new Condition(cond, thenV, this.parseExpression(IF_PRECEDENCE, stopOps)), precedence, stopOps);
      }
      else if (token.value == 'with') {
        const assignments = [];
        while (true) {
          const name = this.tokens.next();
          if (!name || !name.identifier)
            this.throwParseException(name || token, "Expected identifier for constant.");
          if (/(^[A-Z])|(^_$)/.test(name.value))
            this.throwParseException(name || token, `llegal name ${name.value}, must not start constant with capital letter or be the underscore.`);
          const eq = this.expectOp(EQUAL, "Expected equal sign after variable name.");
          const expression = this.parseExpression(WITH_PRECEDENCE, WITH_STOP);
          if (!expression)
            this.throwParseException(eq, "Expression ended unexpectedly.");
          assignments.push(new Assignment(name.value, expression));
          const terminator = this.expectOp(WITH_STOP, "Expected colon or equal sign after expression in 'with' statement.");
          if (terminator.value == ':')
            return new With(assignments, this.parseExpression(precedence, stopOps));
        }
      }
    }
    this.throwParseException(token, "Unexpected token");
  }
   
  // called after an potential left operand for a binary op (or function call)
  tryBinaryOps(left, precedence, stopOps) {
    const binOpToken = this.tokens.peek();
    if (!binOpToken)
      return left;

    if (!binOpToken.operator)
      this.throwParseException(binOpToken, "Expected operator here");
    
    if (stopOps[binOpToken.value])
       return left;
    
    const opPrecedence = binaryOperators[binOpToken.value];
    if (!opPrecedence)
      this.throwParseException(binOpToken, "Unexpected operator");
    
    if (opPrecedence <= precedence)
      return left;
    
    this.tokens.next();
    
    if (binOpToken.value == '(') 
      return this.tryBinaryOps(this.parseCall(left), precedence, stopOps);
    else
      return this.tryBinaryOps(new Operator(binOpToken.value, left, this.parseExpression(binaryOperators[binOpToken.value], stopOps)), precedence, stopOps);
  }
  
  tryLambda(argName, precedence, stopOps) {
    let args;
    const tok = this.tokens.copy();
    if (argName) {
      const ld = tok.next();
      if (!ld || !ld.operator || ld.value != '=>')
        return null;
      args = [argName];
    }
    else {
      args = [];
      const emptyArgsPeek = tok.peek();
      if (!emptyArgsPeek)
        return null;

      if (emptyArgsPeek.operator && emptyArgsPeek.value == ')')
        tok.next();
      else
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
    }
    this.tokens = tok;
    return new Lambda(args, this.parseExpression(precedence, stopOps));
  }
  
  parseCall(left) {
    const argList = [];

    const preview = this.tokens.peek();
    if (preview && preview.operator && preview.value == ')') {
        this.tokens.next();
        return new Call(left, argList);
    }
    
    while (true) {
      const tok = this.tokens.copy();
      const namePreview = tok.next();
      if (!namePreview)
        this.throwParseException(null, 'Unexpected end of expression in the middle of function call');
      if (namePreview.identifier) {
          const eq = tok.next();
          if (eq && eq.operator && eq.value == '=')
            break;
      }
      argList.push(this.parseExpression(PARENS_PRECEDENCE, PARAMETER_STOP));
      
      const separator = this.expectOp(PARAMETER_STOP, "Expected ')' or '='");
      if (separator.value == ')')
        return new Call(left, argList);
    }
 
    const argNames = {};  // for tracking dupes
    const namedArgs = []; // for the actual values

    while (true) {
      const name = this.tokens.next();
      if (!name || !name.identifier)
        this.throwParseException(name, "Expected identifier for named argument");
      if (name in argNames)
        this.throwParseException(name, "Duplicate name in named arguments");
      this.expectOp(EQUAL, "Expected equal sign after identifier for named argument");
      argNames[name.value] = true;
      namedArgs.push(new Assignment(name.value, this.parseExpression(PARENS_PRECEDENCE, PARAMETER_STOP)));

      const next = this.expectOp(PARAMETER_STOP, "Expected ')' or '='");
      if (next && next.operator && next.value == ')')
        break;
    }
    return new Call(left, argList, namedArgs);
  }

  expectOp(allowedTypes, msg) {
    const op = this.tokens.next();
    if (!op)
      this.throwParseException(this.tokens.last(), msg || "Expected operator, but expression ended");
    if (!op.operator || !(op.value in allowedTypes))
      this.throwParseException(this.tokens.last(), msg || "Expected operator");
    return op;
  }
  
  static execute(txt, ctx) {
    return new JEL(txt).execute(ctx);
  }

  static parseTree(txt) {
    return new JEL(txt).parseTree;
  }

}

module.exports = JEL;