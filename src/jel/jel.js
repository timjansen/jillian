/* 
 * Parser and Interpreter for JEL
 */

'use strict';

const Tokenizer = require('./tokenizer.js');
const Context = require('./context.js');
const JelType = require('./type.js');
const JelNode = require('./node.js');
const Pattern = require('./pattern.js');
const Literal = require('./nodes/literal.js');
const Variable = require('./nodes/variable.js');
const Operator = require('./nodes/operator.js');
const List = require('./nodes/list.js');
const Dictionary = require('./nodes/dictionary.js');
const Reference = require('./nodes/reference.js');
const Condition = require('./nodes/condition.js');
const Assignment = require('./nodes/assignment.js');
const With = require('./nodes/with.js');
const Lambda = require('./nodes/lambda.js');
const Call = require('./nodes/call.js');
const Get = require('./nodes/get.js');

const SingleMatchNode = require('../translation/nodes/singlematchnode.js');
const TemplateNode = require('../translation/nodes/templatenode.js');
const MultiOptionsNode = require('../translation/nodes/multioptionsnode.js');
const OptionalOptionsNode = require('../translation/nodes/optionaloptionsnode.js');
const OptionalNode = require('../translation/nodes/optionalnode.js');

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
  '[': 18,
  '{': 18
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
const SQUARE_BRACE_STOP = {']': true};
const LIST_ENTRY_STOP = {']': true, ',': true};
const DICT_KEY_STOP = {':': true, '}': true, ',': true};
const DICT_VALUE_STOP = {',': true, '}': true};
const PARAMETER_STOP = {')': true, ',': true};
const IF_STOP = {'then': true};
const THEN_STOP = {'else': true};
const WITH_STOP = {':': true, ',': true};
const EQUAL = {'=': true};

class JEL {
  constructor(input) {
    this.parseTree = this.parseExpression(Tokenizer.tokenize(input));
  }
  
  // returns value if available, otherwise promise
  executeImmediately(context = {}) {
    const ctx = (context instanceof Context) ? context : new Context(context);
    return this.parseTree.execute(ctx);
  }

  // returns promise with the result
  execute(context = {}) {
    const ctx = (context instanceof Context) ? context : new Context(context);
    return this.parseTree.executePromise(ctx);
  }

  
  throwParseException(token, msg) {
    throw new Error(msg + '\n' + (token ? JSON.stringify(token) : '(no token for reference)'))
  }
  
  parseExpression(tokens, precedence = 0, stopOps = NO_STOP) {
    const token = tokens.next();
    if (!token) 
      this.throwParseException(token, "Unexpected end, expected another token");
    if (token.literal) 
      return this.tryBinaryOps(tokens, new Literal(token.value), precedence, stopOps);
    if (token.identifier) {
      const lambda = this.tryLambda(tokens, token.value, precedence, stopOps);
      return this.tryBinaryOps(tokens, lambda || new Variable(token.value), precedence, stopOps);
    }
    if (token.operator) {
      const unOp = unaryOperators[token.value];
      if (unOp) {
        if ((token.value == '-' || token.value == '+') && tokens.peek() && tokens.peek().literal) {
          const number = tokens.next();
          return this.tryBinaryOps(tokens, new Literal(token.value == '-' ? -number.value : number.value), precedence, stopOps);
        }
        const operand = this.parseExpression(tokens, unOp, stopOps);
        return this.tryBinaryOps(tokens, new Operator(token.value, operand), precedence, stopOps);
      }
      else if (token.value == '(') {
        const lambda = this.tryLambda(tokens, null, precedence, stopOps);
        if (lambda)
          return this.tryBinaryOps(tokens, lambda, precedence, stopOps);
        else {
          const e = this.parseExpression(tokens, PARENS_PRECEDENCE, PARENS_STOP);
          this.expectOp(tokens, PARENS_STOP, "Expected closing parens");
          return this.tryBinaryOps(tokens, e, precedence, stopOps);
        }
      }
      else if (token.value == '[') {
        const possibleEOL = tokens.peek();
        if (!possibleEOL)
          this.throwParseException(token, "Unexpexted end, list not closed");
        if (possibleEOL.operator && possibleEOL.value == ']') {
          tokens.next();
          return this.tryBinaryOps(tokens, new List([]), precedence, stopOps);
        }

        const list = [];
        while (true) {
          list.push(this.parseExpression(tokens, PARENS_PRECEDENCE, LIST_ENTRY_STOP));
          if (this.expectOp(tokens, LIST_ENTRY_STOP, "Expecting comma or end of list").value == ']')
            return this.tryBinaryOps(tokens, new List(list), precedence, stopOps);
        }
      }
      else if (token.value == '{') {
        const closePeek = tokens.peek();
        if (closePeek && closePeek.operator && closePeek.value == '}') {
          tokens.next();
          return this.tryBinaryOps(tokens, new Dictionary(), precedence, stopOps);
        }
        
        const assignments = [];
        const usedNames = {};
        while (true) {
          const name = tokens.next();
          if (!name)
            this.throwParseException(name, "Unexpected end of dictionary");
          if (!name.identifier && !name.literal)
            this.throwParseException(name, "Expected identifier or literal as dictionary key");
          if (name.value in usedNames)
            this.throwParseException(name, `Duplicate key in dictionary: ${name.value}`);
          usedNames[name.value] = true;
 
          const separator = this.expectOp(tokens, DICT_KEY_STOP, "Expected ':', ',' or '}' in Dictionary.");
          if (separator.value == ':') {
            assignments.push(new Assignment(name.value, this.parseExpression(tokens, PARENS_PRECEDENCE, DICT_VALUE_STOP)));

            if (this.expectOp(tokens, DICT_VALUE_STOP, "Expecting comma or end of dictionary").value == '}')
              return this.tryBinaryOps(tokens, new Dictionary(assignments), precedence, stopOps);
          }
          else { // short notation {a}
            if (!name.identifier)
              this.throwParseException(separator, "Dictionary entries require a value, unless an identifier is used in the short notation.");
            assignments.push(new Assignment(name.value, new Variable(name.value)));
            if (separator.value == '}')
              return this.tryBinaryOps(tokens, new Dictionary(assignments), precedence, stopOps);
           }
        }
      }
      else if (token.value == '@') {
        let t2 = tokens.next();
        if (!t2 || !t2.identifier)
          this.throwParseException(token, "Expected identifier after '@' for reference.");
        return this.tryBinaryOps(tokens, new Reference(t2.value), precedence, stopOps);
      }
      else if (token.value == 'if') {
        const cond = this.parseExpression(tokens, IF_PRECEDENCE, IF_STOP);
        this.expectOp(tokens, IF_STOP, "Expected 'then'");
        const thenV = this.parseExpression(tokens, IF_PRECEDENCE, THEN_STOP);
        this.expectOp(tokens, THEN_STOP, "Expected 'else' after 'if'/'then' condition.");
        return this.tryBinaryOps(tokens, new Condition(cond, thenV, this.parseExpression(tokens, IF_PRECEDENCE, stopOps)), precedence, stopOps);
      }
      else if (token.value == 'with') {
        const assignments = [];
        while (true) {
          const name = tokens.next();
          if (!name || !name.identifier)
            this.throwParseException(name || token, "Expected identifier for constant.");
          if (/(^[A-Z])|(^_$)/.test(name.value))
            this.throwParseException(name || token, `llegal name ${name.value}, must not start constant with capital letter or be the underscore.`);
          const eq = this.expectOp(tokens, EQUAL, "Expected equal sign after variable name.");
          const expression = this.parseExpression(tokens, WITH_PRECEDENCE, WITH_STOP);
          if (!expression)
            this.throwParseException(eq, "Expression ended unexpectedly.");
          assignments.push(new Assignment(name.value, expression));
          const terminator = this.expectOp(tokens, WITH_STOP, "Expected colon or equal sign after expression in 'with' statement.");
          if (terminator.value == ':')
            return new With(assignments, this.parseExpression(tokens, precedence, stopOps));
        }
      }
    }
    this.throwParseException(token, "Unexpected token");
  }
   
  // called after an potential left operand for a binary op (or function call)
  tryBinaryOps(tokens, left, precedence, stopOps) {
    const binOpToken = tokens.peek();
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
    
    tokens.next();
    
    if (binOpToken.value == '(') 
      return this.tryBinaryOps(tokens, this.parseCall(tokens, left), precedence, stopOps);
    else if (binOpToken.value == '[') 
      return this.tryBinaryOps(tokens, this.parseGet(tokens, left), precedence, stopOps);
    else
      return this.tryBinaryOps(tokens, new Operator(binOpToken.value, left, this.parseExpression(tokens, binaryOperators[binOpToken.value], stopOps)), precedence, stopOps);
  }
  
  tryLambda(tokens, argName, precedence, stopOps) {
    let args;
    const tok = tokens.copy();
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
    tokens.i = tok.i;
    return new Lambda(args, this.parseExpression(tokens, precedence, stopOps));
  }
  
  parseCall(tokens, left) {
    const argList = [];

    const preview = tokens.peek();
    if (preview && preview.operator && preview.value == ')') {
        tokens.next();
        return new Call(left, argList);
    }
    
    while (true) {
      const tok = tokens.copy();
      const namePreview = tok.next();
      if (!namePreview)
        this.throwParseException(null, 'Unexpected end of expression in the middle of function call');
      if (namePreview.identifier) {
          const eq = tok.next();
          if (eq && eq.operator && eq.value == '=')
            break;
      }
      argList.push(this.parseExpression(tokens, PARENS_PRECEDENCE, PARAMETER_STOP));
      
      const separator = this.expectOp(tokens, PARAMETER_STOP, "Expected ')' or '='");
      if (separator.value == ')')
        return new Call(left, argList);
    }
 
    const argNames = {};  // for tracking dupes
    const namedArgs = []; // for the actual values

    while (true) {
      const name = tokens.next();
      if (!name || !name.identifier)
        this.throwParseException(name, "Expected identifier for named argument");
      if (name in argNames)
        this.throwParseException(name, "Duplicate name in named arguments");
      this.expectOp(tokens, EQUAL, "Expected equal sign after identifier for named argument");
      argNames[name.value] = true;
      namedArgs.push(new Assignment(name.value, this.parseExpression(tokens, PARENS_PRECEDENCE, PARAMETER_STOP)));

      const next = this.expectOp(tokens, PARAMETER_STOP, "Expected ')' or '='");
      if (next && next.operator && next.value == ')')
        break;
    }
    return new Call(left, argList, namedArgs);
  }

  parseGet(tokens, left) {
    const nameExp = this.parseExpression(tokens, PARENS_PRECEDENCE, SQUARE_BRACE_STOP);
    this.expectOp(tokens, SQUARE_BRACE_STOP, "Closing square bracket");
    return new Get(left, nameExp);
  }
  
  expectOp(tokens, allowedTypes, msg) {
    const op = tokens.next();
    if (!op)
      this.throwParseException(tokens.last(), msg || "Expected operator, but expression ended");
    if (!op.operator || !(op.value in allowedTypes))
      this.throwParseException(tokens.last(), msg || "Expected operator");
    return op;
  }
  
  static createPattern(input) {
    return new Pattern(this.parsePattern(Tokenizer.tokenizePattern(input)));
  }
  
  static parsePattern(tok) {
		const t = tok.next();
		if (!t)
			return undefined;
		else if (t.word) 
			return new SingleMatchNode(t.word, this.parsePattern(tok));
		else if (t.template)
			return new TemplateNode(t.template, t.name, t.hints, t.expression, this.parsePattern(tok));

		switch(t.op) {
			case '[':
				const optionNode = this.parsePatternOptions(tok);
				optionNode.addFollower(this.parsePattern(tok));
				return optionNode;
			case ']':	
			case ']?':
			case '|':
				tok.undo();
				return undefined; 
		}
		throw new Error(`Unexpected token in pattern`);
	}

	static parsePatternOptions(tok) {
		const opts = [];
		while(true) {
			const exp = this.parsePattern(tok);
			if (!exp)
				throw new Error(`Option can't be empty`);
			opts.push(exp);
		
			const stopper = tok.next();
			if (!stopper)
				throw new Error(`Unexpected end in option set`);
			if (stopper.op == '|')
				continue;
			if (!opts.length)
				throw new Error(`Unexpected end of option set. Can not be empty.`);

			if (stopper.op == ']?') {
				if (opts.length == 1)
					return OptionalNode.findBest(opts[0]);
				else
					return OptionalOptionsNode.findBest(opts);
			}
			else 
				return MultiOptionsNode.findBest(opts); 
		}
	}

  
  
  
  static execute(txt, ctx) {
    return new JEL(txt).execute(ctx);
  }

  static parseTree(txt) {
    return new JEL(txt).parseTree;
  }

}

module.exports = JEL;