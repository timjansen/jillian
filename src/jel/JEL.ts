/* 
 * Parser and Interpreter for JEL
 */

import Tokenizer from './Tokenizer';
import {Token, TokenType, TemplateToken, RegExpToken} from './Token';
import TokenReader from './TokenReader';
import Context from './Context';
import JelType from './JelType';
import Pattern from './Pattern';
import ParseError from './ParseError';
import JelNode from './expressionNodes/JelNode';
import Literal from './expressionNodes/Literal';
import ExpressionPattern from './expressionNodes/Pattern';
import Variable from './expressionNodes/Variable';
import Operator from './expressionNodes/Operator';
import List from './expressionNodes/List';
import Dictionary from './expressionNodes/Dictionary';
import Translator from './expressionNodes/Translator';
import Reference from './expressionNodes/Reference';
import Condition from './expressionNodes/Condition';
import Assignment from './expressionNodes/Assignment';
import PatternAssignment from './expressionNodes/PatternAssignment';
import With from './expressionNodes/With';
import Lambda from './expressionNodes/Lambda';
import Call from './expressionNodes/Call';
import Get from './expressionNodes/Get';

import MatchNode from './patternNodes/MatchNode';
import PatternNode from './patternNodes/PatternNode';
import TemplateNode from './patternNodes/TemplateNode';
import RegExpNode from './patternNodes/RegExpNode';

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
  '>>=': 11,
  '<<=': 11,
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
const TRANSLATOR_META_STOP = {',': true, ':': true, '=': true};
const TRANSLATOR_META_VALUE_STOP = {',': true, ':': true};
const TRANSLATOR_PATTERN_STOP = {'=>': true};
const TRANSLATOR_LAMBDA_STOP = {',': true, '}': true};
const TRANSLATOR_DOUBLE_BRACE_STOP = {'}': true};
const PARAMETER_STOP = {')': true, ',': true};
const IF_STOP = {'then': true};
const THEN_STOP = {'else': true};
const WITH_STOP = {':': true, ',': true};
const EQUAL = {'=': true};

const TERMINATOR = new PatternNode();


export default class JEL {
	parseTree: JelNode;
	
  constructor(input: string) {
    this.parseTree = JEL.parseExpression(Tokenizer.tokenize(input));
  }
  
  // returns value if available, otherwise promise
  executeImmediately(context = new Context()): any {
    return this.parseTree.execute(context.freeze());
  }

  // returns promise with the result
  execute(context = new Context()): Promise<any> {
    return this.parseTree.executePromise(context.freeze());
  }

  
  static throwParseException(token: Token, msg: string, cause?: Error): never {
    throw new ParseError(cause, msg, token);
	}
  
  static parseExpression(tokens: TokenReader, precedence = 0, stopOps = NO_STOP): JelNode {
    const token = tokens.next();
    if (!token) 
      JEL.throwParseException(token, "Unexpected end, expected another token");
    if (token.type == TokenType.Literal) 
      return JEL.tryBinaryOps(tokens, new Literal(token.value), precedence, stopOps);
    if (token.type == TokenType.Identifier) {
      const lambda = JEL.tryLambda(tokens, token.value, precedence, stopOps);
      return JEL.tryBinaryOps(tokens, lambda || new Variable(token.value), precedence, stopOps);
    }
    if (token.type == TokenType.Pattern) {
      return JEL.tryBinaryOps(tokens, new ExpressionPattern(JEL.createPattern(token.value, token)), precedence, stopOps);
    }
    if (token.type == TokenType.Operator) {
      const unOp = unaryOperators[token.value];
      if (unOp) {
        if ((token.value == '-' || token.value == '+') && tokens.peek() && tokens.peek().type == TokenType.Literal) {
          const number = tokens.next();
          return JEL.tryBinaryOps(tokens, new Literal(token.value == '-' ? -number.value : number.value), precedence, stopOps);
        }
        const operand = JEL.parseExpression(tokens, unOp, stopOps);
        return JEL.tryBinaryOps(tokens, new Operator(token.value, operand), precedence, stopOps);
      }
      else if (token.value == '(') {
        const lambda = JEL.tryLambda(tokens, null, precedence, stopOps);
        if (lambda)
          return JEL.tryBinaryOps(tokens, lambda, precedence, stopOps);
        else {
          const e = JEL.parseExpression(tokens, PARENS_PRECEDENCE, PARENS_STOP);
          JEL.expectOp(tokens, PARENS_STOP, "Expected closing parens");
          return JEL.tryBinaryOps(tokens, e, precedence, stopOps);
        }
      }
      else if (token.value == '[') {
        const possibleEOL = tokens.peek();
        if (!possibleEOL)
          JEL.throwParseException(token, "Unexpexted end, list not closed");
        if (possibleEOL.type == TokenType.Operator && possibleEOL.value == ']') {
          tokens.next();
          return JEL.tryBinaryOps(tokens, new List([]), precedence, stopOps);
        }

        const list = [];
        while (true) {
          list.push(JEL.parseExpression(tokens, PARENS_PRECEDENCE, LIST_ENTRY_STOP));
          if (JEL.expectOp(tokens, LIST_ENTRY_STOP, "Expecting comma or end of list").value == ']')
            return JEL.tryBinaryOps(tokens, new List(list), precedence, stopOps);
        }
      }
      else if (token.value == '{') {
        const closePeek = tokens.peek();
        if (closePeek && closePeek.type == TokenType.Operator && closePeek.value == '}') {
          tokens.next();
          return JEL.tryBinaryOps(tokens, new Dictionary(), precedence, stopOps);
        }
        
        const assignments = [];
        const usedNames = {};
        while (true) {
          const name = tokens.next();
          if (!name)
            JEL.throwParseException(name, "Unexpected end of dictionary");
          if (name.type != TokenType.Identifier && name.type != TokenType.Literal)
            JEL.throwParseException(name, "Expected identifier or literal as dictionary key");
          if (name.value in usedNames)
            JEL.throwParseException(name, `Duplicate key in dictionary: ${name.value}`);
          usedNames[name.value] = true;
 
          const separator = JEL.expectOp(tokens, DICT_KEY_STOP, "Expected ':', ',' or '}' in Dictionary.");
          if (separator.value == ':') {
 	          assignments.push(new Assignment(name.value, JEL.parseExpression(tokens, PARENS_PRECEDENCE, DICT_VALUE_STOP)));

            if (JEL.expectOp(tokens, DICT_VALUE_STOP, "Expecting comma or end of dictionary").value == '}')
              return JEL.tryBinaryOps(tokens, new Dictionary(assignments), precedence, stopOps);
          }
          else { // short notation {a}
            if (name.type != TokenType.Identifier)
              JEL.throwParseException(separator, "Dictionary entries require a value, unless an identifier is used in the short notation.");
            assignments.push(new Assignment(name.value, new Variable(name.value)));
            if (separator.value == '}')
              return JEL.tryBinaryOps(tokens, new Dictionary(assignments), precedence, stopOps);
           }
        }
      }
      else if (token.value == '{{') {
        const closePeek = tokens.peek();
        if (closePeek && closePeek.type == TokenType.Operator && closePeek.value == '}') {
          tokens.next();
					JEL.expectOp(tokens, TRANSLATOR_DOUBLE_BRACE_STOP, "Need 2nd closing brace to end translator");
          return JEL.tryBinaryOps(tokens, new Translator(), precedence, stopOps);
        }
        
        const assignments = [];

        while (true) {
          const name = tokens.next();
					const metaAssignments = [];

					if (!name)
            JEL.throwParseException(name, "Unexpected end of translator");
					
          if (name.type == TokenType.Identifier) {
						tokens.undo();
						
						while (true) {
							const name = tokens.next();
							if (!name || name.type != TokenType.Identifier)
								JEL.throwParseException(name || token, "Expected identifier for translator meta.");
							const eq = JEL.expectOp(tokens, TRANSLATOR_META_STOP, "Expected equal sign or comma or colon after meta name.");
							if (eq.value == '=') {
								const expression = JEL.parseExpression(tokens, PARENS_PRECEDENCE, TRANSLATOR_META_VALUE_STOP);
								if (!expression)
									JEL.throwParseException(eq, "Expression ended unexpectedly.");
								metaAssignments.push(new Assignment(name.value, expression));

								const terminator = JEL.expectOp(tokens, TRANSLATOR_META_VALUE_STOP, "Expected colon or comm after expression in translator.");
								if (terminator.value == ':')
									break;
							}
							else {
								metaAssignments.push(new Assignment(name.value, Literal.TRUE));
								if (eq.value == ':')
									break;
							}
						}
					}
					
					const pattern = name.type == TokenType.Pattern ? name : tokens.next();
          if (!pattern)
            JEL.throwParseException(pattern, "Unexpected end of translator");
					if (pattern.type != TokenType.Pattern)
            JEL.throwParseException(pattern, "Expected pattern in translator");

					const keyPattern = JEL.createPattern(pattern.value, pattern);

	        JEL.expectOp(tokens, TRANSLATOR_PATTERN_STOP, "Expected '=>' in Translator.");
						
					assignments.push(new PatternAssignment(keyPattern, JEL.parseExpression(tokens, precedence, TRANSLATOR_LAMBDA_STOP), metaAssignments));

					if (JEL.expectOp(tokens, TRANSLATOR_LAMBDA_STOP, "Expecting comma or end of translator").value == '}') {
						JEL.expectOp(tokens, TRANSLATOR_DOUBLE_BRACE_STOP, "Need 2nd closing brace to end translator");
						return JEL.tryBinaryOps(tokens, new Translator(assignments), precedence, stopOps);
					}
        }
      }
      else if (token.value == '@') {
        let t2 = tokens.next();
        if (!t2 || t2.type != TokenType.Identifier)
          JEL.throwParseException(token, "Expected identifier after '@' for reference.");
        return JEL.tryBinaryOps(tokens, new Reference(t2.value), precedence, stopOps);
      }
      else if (token.value == 'if') {
        const cond = JEL.parseExpression(tokens, IF_PRECEDENCE, IF_STOP);
        JEL.expectOp(tokens, IF_STOP, "Expected 'then'");
        const thenV = JEL.parseExpression(tokens, IF_PRECEDENCE, THEN_STOP);
				const elseT = tokens.peek();
				if (elseT && elseT.type == TokenType.Operator && elseT.value == 'else') {
					tokens.next();
					return JEL.tryBinaryOps(tokens, new Condition(cond, thenV, JEL.parseExpression(tokens, IF_PRECEDENCE, stopOps)), precedence, stopOps);
				}
				else
					return JEL.tryBinaryOps(tokens, new Condition(cond, thenV, Literal.TRUE), precedence, stopOps);
      }
      else if (token.value == 'with') {
        const assignments = [];
        while (true) {
          const name = tokens.next();
          if (!name || name.type != TokenType.Identifier)
            JEL.throwParseException(name || token, "Expected identifier for constant.");
          if (/(^[A-Z])|(^_$)/.test(name.value))
            JEL.throwParseException(name || token, `Illegal name ${name.value}, must not start constant with capital letter or be the underscore.`);
          const eq = JEL.expectOp(tokens, EQUAL, "Expected equal sign after variable name.");
          const expression = JEL.parseExpression(tokens, WITH_PRECEDENCE, WITH_STOP);
          if (!expression)
            JEL.throwParseException(eq, "Expression ended unexpectedly.");
          assignments.push(new Assignment(name.value, expression));
          const terminator = JEL.expectOp(tokens, WITH_STOP, "Expected colon or equal sign after expression in 'with' statement.");
          if (terminator.value == ':')
            return new With(assignments, JEL.parseExpression(tokens, precedence, stopOps));
        }
      }
    }
    JEL.throwParseException(token, "Unexpected token");
  }
   
  // called after an potential left operand for a binary op (or function call)
  static tryBinaryOps(tokens: TokenReader, left: JelNode, precedence: number, stopOps: any): JelNode {
    const binOpToken = tokens.peek();
    if (!binOpToken)
      return left;

    if (binOpToken.type != TokenType.Operator)
      JEL.throwParseException(binOpToken, "Expected operator here");
    
    if (stopOps[binOpToken.value])
       return left;
    
    const opPrecedence = binaryOperators[binOpToken.value];
    if (!opPrecedence)
      JEL.throwParseException(binOpToken, "Unexpected operator");
    
    if (opPrecedence <= precedence)
      return left;
    
    tokens.next();
    
    if (binOpToken.value == '(') 
      return JEL.tryBinaryOps(tokens, JEL.parseCall(tokens, left), precedence, stopOps);
    else if (binOpToken.value == '[') 
      return JEL.tryBinaryOps(tokens, JEL.parseGet(tokens, left), precedence, stopOps);
    else
      return JEL.tryBinaryOps(tokens, new Operator(binOpToken.value, left, JEL.parseExpression(tokens, binaryOperators[binOpToken.value], stopOps)), precedence, stopOps);
  }
  
  static tryLambda(tokens: TokenReader, argName: string | null, precedence: number, stopOps: any): Lambda | null {
    let args;
    const tok = tokens.copy();
    if (argName) {
      const ld = tok.next();
      if (!ld || ld.type != TokenType.Operator || ld.value != '=>')
        return null;
      args = [argName];
    }
    else {
      args = [];
      const emptyArgsPeek = tok.peek();
      if (!emptyArgsPeek)
        return null;

      if (emptyArgsPeek.type == TokenType.Operator && emptyArgsPeek.value == ')')
        tok.next();
      else
        while (true) {
          const name = tok.next();
          if (!name || name.type != TokenType.Identifier)
             return null;
          args.push(name.value);
          const terminator = tok.next();
          if (!terminator || terminator.type != TokenType.Operator || !PARAMETER_STOP[terminator.value])
            return null;
          if (terminator.value == ')')
            break;
      }  
      const ld = tok.next();
      if (!ld || ld.type != TokenType.Operator || ld.value != '=>')
        return null;
    }
    TokenReader.copyInto(tok, tokens);
    return new Lambda(args, JEL.parseExpression(tokens, precedence, stopOps));
  }
  
  static parseCall(tokens: TokenReader, left: JelNode): Call {
    const argList = [];

    const preview = tokens.peek();
    if (preview && preview.type == TokenType.Operator && preview.value == ')') {
        tokens.next();
        return new Call(left, argList);
    }
    
    while (true) {
      const tok = tokens.copy();
      const namePreview = tok.next();
      if (!namePreview)
        JEL.throwParseException(null, 'Unexpected end of expression in the middle of function call');
      if (namePreview.type == TokenType.Identifier) {
          const eq = tok.next();
          if (eq && eq.type == TokenType.Operator && eq.value == '=')
            break;
      }
      argList.push(JEL.parseExpression(tokens, PARENS_PRECEDENCE, PARAMETER_STOP));
      
      const separator = JEL.expectOp(tokens, PARAMETER_STOP, "Expected ')' or '='");
      if (separator.value == ')')
        return new Call(left, argList);
    }
 
    const argNames = {};  // for tracking dupes
    const namedArgs = []; // for the actual values

    while (true) {
      const name = tokens.next();
      if (!name || name.type != TokenType.Identifier)
        JEL.throwParseException(name, "Expected identifier for named argument");
      if (name.value in argNames)
        JEL.throwParseException(name, "Duplicate name in named arguments");
      JEL.expectOp(tokens, EQUAL, "Expected equal sign after identifier for named argument");
      argNames[name.value] = true;
      namedArgs.push(new Assignment(name.value, JEL.parseExpression(tokens, PARENS_PRECEDENCE, PARAMETER_STOP)));

      const next = JEL.expectOp(tokens, PARAMETER_STOP, "Expected ')' or '='");
      if (next && next.type == TokenType.Operator && next.value == ')')
        break;
    }
    return new Call(left, argList, namedArgs);
  }

  static parseGet(tokens: TokenReader, left: JelNode): Get {
    const nameExp = JEL.parseExpression(tokens, PARENS_PRECEDENCE, SQUARE_BRACE_STOP);
    JEL.expectOp(tokens, SQUARE_BRACE_STOP, "Closing square bracket");
    return new Get(left, nameExp);
  }
  
  static expectOp(tokens: TokenReader, allowedTypes: any, msg?: string): Token {
    const op = tokens.next();
    if (!op)
      JEL.throwParseException(tokens.last(), msg || "Expected operator, but expression ended");
    if (op.type != TokenType.Operator || !(op.value in allowedTypes))
      JEL.throwParseException(tokens.last(), msg || "Expected operator");
    return op;
  }
  
  static createPattern(value: string, jelToken: Token): Pattern {
    return new Pattern(JEL.parsePattern(Tokenizer.tokenizePattern(value), jelToken), value);
  }
  
	
  static parsePattern(tok: TokenReader, jelToken: Token, expectStopper = false, targetNode = new PatternNode()): PatternNode {
		const t = tok.next();
		if (!t) 
			return TERMINATOR;
		else if (t.type == TokenType.Word) 
			return targetNode.addTokenMatch(t.value, JEL.parsePattern(tok, jelToken, expectStopper));
		else if (t.type == TokenType.Template) {
			const t0 = t as TemplateToken;
			try {	
				return targetNode.addTemplateMatch(new TemplateNode(t0.template, t0.name, t0.metaFilter, t0.expression ? JEL.parseTree(t0.expression) : undefined, JEL.parsePattern(tok, jelToken, expectStopper)));
			}
			catch (e) {
				JEL.throwParseException(jelToken, "Can not parse expression ${t.expression} embedded in pattern", e);
			}
		}
		else if (t.type == TokenType.RegExp) {
			const t0 = t as RegExpToken;
			const regexps = t0.regexps.map(s=>RegExp(s.replace(/^([^^])/, "^$1").replace(/([^$])$/, "$1$")));
			return targetNode.addTemplateMatch(new RegExpNode(regexps, t0.name, t0.expression ? JEL.parseTree(t0.expression) : undefined, JEL.parsePattern(tok, jelToken, expectStopper)));
		}

		switch(t.value) {
			case '[':
				while(true) {
					this.parsePattern(tok, jelToken, true, targetNode);

					const stopper = tok.next();
					if (!stopper || stopper.type != TokenType.Operator)
						throw new Error(`Unexpected end in option set`);
					if (stopper.value == ']?') {
						targetNode.makeOptional(JEL.parsePattern(tok, jelToken, expectStopper));
					}
					else if (stopper.value == ']')
						targetNode.append(JEL.parsePattern(tok, jelToken, expectStopper));

					if (stopper.value != '|')
						break;
				}
				return targetNode;
			case ']':	
			case ']?':
			case '|':
				if (expectStopper) {
					tok.undo();
					return undefined;
				}
				throw new Error(`Unexpected operator in pattern: ${t.value}`);
		}
		throw new Error(`Unexpected token in pattern`);
	}
  
  static execute(txt: string, ctx: Context): Promise<any> {
    return new JEL(txt).execute(ctx);
  }

  static parseTree(txt: string): JelNode {
    return new JEL(txt).parseTree;
  }

}

