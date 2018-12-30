/* 
 * Parser and Interpreter for JEL
 */

import Util from '../util/Util';
import Tokenizer from './Tokenizer';
import {Token, TokenType, TemplateToken, RegExpToken, FractionToken} from './Token';
import TokenReader from './TokenReader';
import PatternParser from './PatternParser';
import Context from './Context';
import BaseTypeRegistry from './BaseTypeRegistry';
import ParseError from './ParseError';
import JelNode from './expressionNodes/JelNode';
import ClassDef from './expressionNodes/ClassDef';
import Literal from './expressionNodes/Literal';
import Fraction from './expressionNodes/Fraction';
import ExpressionPattern from './expressionNodes/Pattern';
import Variable from './expressionNodes/Variable';
import Operator from './expressionNodes/Operator';
import List from './expressionNodes/List';
import ListType from './expressionNodes/ListType';
import DictType from './expressionNodes/DictType';
import Rangable from './expressionNodes/Rangable';
import Range from './expressionNodes/Range';
import Dictionary from './expressionNodes/Dictionary';
import Translator from './expressionNodes/Translator';
import Reference from './expressionNodes/Reference';
import Condition from './expressionNodes/Condition';
import TypedParameterDefinition from './expressionNodes/TypedParameterDefinition';
import Assignment from './expressionNodes/Assignment';
import PatternAssignment from './expressionNodes/PatternAssignment';
import Let from './expressionNodes/Let';
import Lambda from './expressionNodes/Lambda';
import Call from './expressionNodes/Call';
import MethodCall from './expressionNodes/MethodCall';
import Optional from './expressionNodes/Optional';
import Options from './expressionNodes/Options';
import Get from './expressionNodes/Get';
import UnitValue from './expressionNodes/UnitValue';
import As from './expressionNodes/As';
import InstanceOf from './expressionNodes/InstanceOf';

const binaryOperators: any = { // op->precedence
  '?': 40,
  '<>': 40,
  '[]': 40,
  '{}': 40,
  '.': 30,
	'|': 20,  // must be higher than instanceof/as, but lower than ?/[]/{}/()
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
  '+': 13,
  '-': 13,
  '*': 14,
  '/': 14,
  '%': 14,
  'instanceof': 16,
  'as': 16,
	'^': 15,
  '+-': 18, 
  '...': 24,
  '(': 25,
  '[': 25,
  '{': 25
};
const unaryOperators: any = { // op->precedence
  '-': 17,
  '+': 17,
  '!': 17
};

const overloadableOperators: any = {'+': true, '-': true, '*': true, '/': true, '%': true, '==': true, '===': true, '!=': true, '!==': true, '<': true, '<<': true, '<=': true, '<<=': true, '>': true, '>>': true, '>=': true, '>>=': true};
const overloadableSingleOps: any = {'+': true, '-': true, '!': true};

const IF_PRECEDENCE = 4; 
const PARENS_PRECEDENCE = 4; 
const LET_PRECEDENCE = 4; 
const CLASS_PRECEDENCE = 4; 

const NO_STOP = {};
const PARENS_STOP = {')': true};
const SQUARE_BRACE_STOP = {']': true};
const LIST_ENTRY_STOP = {']': true, ',': true};
const DICT_KEY_STOP = {':': true, '}': true, ',': true};
const DICT_VALUE_STOP = {',': true, '}': true};
const LAMBDA_KEY_STOP = {':': true, ')': true, ',': true};
const LAMBDA_TYPE_STOP = {',': true, '=': true, ')': true};
const LAMBDA_VALUE_STOP = {',': true, ')': true};
const TRANSLATOR_META_STOP = {',': true, ':': true, '=': true};
const TRANSLATOR_META_VALUE_STOP = {',': true, ':': true};
const TRANSLATOR_PATTERN_STOP = {'=>': true};
const TRANSLATOR_LAMBDA_STOP = {',': true, '}': true};
const PARAMETER_STOP: any = {')': true, ',': true};
const IF_STOP = {'then': true};
const THEN_STOP = {'else': true};
const LET_STOP = {':': true, ',': true};
const CLASS_EXTENDS_STOP = {':': true, ',': true, identifier: true};
const CLASS_EXPRESSION_STOP = {identifier: true};
const CLASS_TYPE_EXPRESSION_STOP = {'=': true, identifier: true};

const EQUAL = {'=': true};
const COLON = {':': true};
const OPEN_ARGS = {'(': true};
const CLOSE_ARGS = {')': true};

const EMPTY_LIST = new List([]);
const EMPTY_DICT = new Dictionary([]);

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
	
	static nextOrThrow(tokens: TokenReader, msg: string): Token {
		if (tokens.hasNext())
			return tokens.next();
		JEL.throwParseException(tokens.last(), msg);
		return undefined as any; // just to make Typescript happy
	}
	 
  static parseExpression(tokens: TokenReader, precedence = 0, stopOps = NO_STOP): JelNode {
    const token = JEL.nextOrThrow(tokens, "Unexpected end, expected another token");
    if (token.type == TokenType.Literal) {
			if (typeof token.value == 'number' && tokens.peekIs(TokenType.Operator, '@'))
				return JEL.parseUnitValue(tokens, new Literal(token.value), precedence, stopOps);
			else
	      return JEL.tryBinaryOps(tokens, new Literal(token.value), precedence, stopOps);
		}
    if (token.type == TokenType.Fraction) {
			if (tokens.peekIs(TokenType.Operator, '@'))
				return JEL.parseUnitValue(tokens, new Fraction((token as FractionToken).numerator, (token as FractionToken).denominator), precedence, stopOps);
			else
	      return JEL.tryBinaryOps(tokens, new Fraction((token as FractionToken).numerator, (token as FractionToken).denominator), precedence, stopOps);
		}
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
        if ((token.value == '-' || token.value == '+') && ((tokens.peekIs(TokenType.Literal) && typeof tokens.peek().value == 'number')  || tokens.peekIs(TokenType.Fraction))) {
					const number = tokens.next();
					const node = number.type == TokenType.Literal ? new Literal(token.value == '-' ? -number.value : number.value) : 
						new Fraction((number as FractionToken).numerator * (token.value == '-' ? -1 : 1), (number as FractionToken).denominator);

					if (tokens.peekIs(TokenType.Operator, '@'))
						return JEL.parseUnitValue(tokens, node, precedence, stopOps);
					else
	      		return JEL.tryBinaryOps(tokens, node, precedence, stopOps);
				}
        const operand = JEL.parseExpression(tokens, unOp, stopOps);
        return JEL.tryBinaryOps(tokens, new Operator(token.value, operand), precedence, stopOps);
      }
      else {
        switch (token.value) {
          case '(':
            const lambda = JEL.tryLambda(tokens, null, precedence, stopOps);
            if (lambda)
              return JEL.tryBinaryOps(tokens, lambda, precedence, stopOps);
            else {
              const e = JEL.parseExpression(tokens, PARENS_PRECEDENCE, PARENS_STOP);
              JEL.expectOp(tokens, PARENS_STOP, "Expected closing parens");
              return JEL.tryBinaryOps(tokens, e, precedence, stopOps);
            }
          case '[':
              return JEL.parseList(tokens, token, precedence, stopOps);
          case '{':
              return JEL.parseDictionary(tokens, precedence, stopOps);
          case '[]':
              return JEL.tryBinaryOps(tokens, EMPTY_LIST, precedence, stopOps);
          case '{}':
              return JEL.tryBinaryOps(tokens, EMPTY_DICT, precedence, stopOps);
          case '${': 
              return JEL.parseTranslator(tokens, token, precedence, stopOps);
          case '@': 
            const t2 = JEL.nextOrThrow(tokens, "Expected identifier after '@' for reference.");
            if (t2.type != TokenType.Identifier)
              JEL.throwParseException(token, "Expected identifier after '@' for reference.");
            if (tokens.nextIf(TokenType.Operator, '(')) {
              const assignments: Assignment[] = JEL.parseParameters(tokens, PARENS_PRECEDENCE, PARAMETER_STOP, ')', "Expected comma or closing parens", 'parameter');
              return JEL.tryBinaryOps(tokens, new Reference(t2.value, assignments), precedence, stopOps);
            }
            else
              return JEL.tryBinaryOps(tokens, new Reference(t2.value), precedence, stopOps);
          case 'if':
            const cond = JEL.parseExpression(tokens, IF_PRECEDENCE, IF_STOP);
            JEL.expectOp(tokens, IF_STOP, "Expected 'then'");
            const thenV = JEL.parseExpression(tokens, IF_PRECEDENCE, THEN_STOP);
            if (tokens.nextIf(TokenType.Operator, 'else'))
              return JEL.tryBinaryOps(tokens, new Condition(cond, thenV, JEL.parseExpression(tokens, IF_PRECEDENCE, stopOps)), precedence, stopOps);
            else
              return JEL.tryBinaryOps(tokens, new Condition(cond, thenV, new Literal(true)), precedence, stopOps);
          case 'let':
            const assignments: Assignment[] = JEL.parseParameters(tokens, LET_PRECEDENCE, LET_STOP, ':', "Expected colon or equal sign after expression in 'let' statement,", 'constant');
            return JEL.tryBinaryOps(tokens, new Let(assignments, JEL.parseExpression(tokens, LET_PRECEDENCE, stopOps)), precedence, stopOps);
          case 'class':
            return JEL.tryBinaryOps(tokens, JEL.parseClass(tokens, precedence, stopOps), precedence, stopOps);
          case '*':
            return JEL.tryBinaryOps(tokens, new Literal(null), precedence, stopOps);
        }
      }
    }
    JEL.throwParseException(token, "Unexpected token");
		return undefined as any; // this is a dummy return to make Typescript happy
  }

  
	static parseDictionary(tokens: TokenReader, precedence: number, stopOps: any): JelNode {
		if (tokens.nextIf(TokenType.Operator, '}'))
			return JEL.tryBinaryOps(tokens, EMPTY_DICT, precedence, stopOps);

		const assignments: Assignment[] = [];
		const usedNames: any = new Set();
		while (true) {
			const name = JEL.nextOrThrow(tokens, "Unexpected end of dictionary");
			if (name.type != TokenType.Identifier && name.type != TokenType.Literal)
				JEL.throwParseException(name, "Expected identifier or literal as dictionary key");
			if (usedNames.has(name.value))
				JEL.throwParseException(name, `Duplicate key in dictionary: ${name.value}`);
			usedNames.add(name.value);

			const separator = JEL.expectOp(tokens, DICT_KEY_STOP, "Expected ':', ',' or '}' in Dictionary.");
			if (separator.value == ':') {
				assignments.push(new Assignment(name.value, JEL.parseExpression(tokens, PARENS_PRECEDENCE, DICT_VALUE_STOP)));

				if (JEL.expectOp(tokens, DICT_VALUE_STOP, "Expecting comma or end of dictionary").value == '}')
					return JEL.tryBinaryOps(tokens, new Dictionary(assignments), precedence, stopOps);
			}
			else { // short notation {a}
				if (name.type != TokenType.Identifier)
					JEL.throwParseException(separator, "Dictionary entries require a value, unless an identifier is used in the short notation;");
				assignments.push(new Assignment(name.value, new Variable(name.value)));
				if (separator.value == '}')
					return JEL.tryBinaryOps(tokens, new Dictionary(assignments), precedence, stopOps);
			 }
		}
	}
	
	static parseTranslator(tokens: TokenReader, startToken: Token, precedence: number, stopOps: any): JelNode {
		if (tokens.nextIf(TokenType.Operator, '}'))
			return JEL.tryBinaryOps(tokens, new Translator(), precedence, stopOps);

		const assignments: PatternAssignment[] = [];

		while (true) {
			const metaAssignments: Assignment[] = [];

			const name = JEL.nextOrThrow(tokens, "Unexpected end of translator");
			if (name.type == TokenType.Identifier) {
				tokens.undo();

				while (true) {
					if (!tokens.hasNext()) 
						JEL.throwParseException(startToken, "Expected identifier for translator meta");   // TODO: optimize using nextOrThrow???
					const name = tokens.next();
					if (name.type != TokenType.Identifier)
						JEL.throwParseException(name || startToken, "Expected identifier for translator meta");
					const eq = JEL.expectOp(tokens, TRANSLATOR_META_STOP, "Expected equal sign or comma or colon after meta name");
					if (eq.value == '=') {
						const expression = JEL.parseExpression(tokens, PARENS_PRECEDENCE, TRANSLATOR_META_VALUE_STOP);
						if (!expression)
							JEL.throwParseException(eq, "Expression ended unexpectedly.");
						metaAssignments.push(new Assignment(name.value, expression));

						const terminator = JEL.expectOp(tokens, TRANSLATOR_META_VALUE_STOP, "Expected colon or comma after expression in translator.");
						if (terminator.value == ':')
							break;
					}
					else {
						metaAssignments.push(new Assignment(name.value, new Literal(true)));
						if (eq.value == ':')
							break;
					}
				}
			}

			const pattern = name.type == TokenType.Pattern ? name : JEL.nextOrThrow(tokens, "Unexpected end of translator");
			if (pattern.type != TokenType.Pattern)
				JEL.throwParseException(pattern, "Expected pattern in translator");

			const keyPattern = JEL.createPattern(pattern.value, pattern);

			JEL.expectOp(tokens, TRANSLATOR_PATTERN_STOP, "Expected '=>' in Translator.");

			assignments.push(new PatternAssignment(keyPattern, JEL.parseExpression(tokens, precedence, TRANSLATOR_LAMBDA_STOP), metaAssignments));

			if (JEL.expectOp(tokens, TRANSLATOR_LAMBDA_STOP, "Expecting comma or end of translator").value == '}') {
				return JEL.tryBinaryOps(tokens, new Translator(assignments), precedence, stopOps);
			}
		}
	}
	
	static parseUnitValue(tokens: TokenReader, content: JelNode, precedence: number, stopOps: any) {
		tokens.next();
		
		const t2 = JEL.nextOrThrow(tokens, "Expected identifier after '@' for reference / unit value.");
    if (t2.type != TokenType.Identifier)
			JEL.throwParseException(t2, "Expected identifier after '@' for reference / unit value.");

		return JEL.tryBinaryOps(tokens, new UnitValue(content, t2.value), precedence, stopOps);
	}

	
	static parseList(tokens: TokenReader, startToken: Token, precedence: number, stopOps: any): JelNode {
		const possibleEOL = tokens.peek();
		if (!possibleEOL)
			JEL.throwParseException(startToken, "Unexpexted end, list not closed");
		if (possibleEOL.type == TokenType.Operator && possibleEOL.value == ']') {
			tokens.next();
			return JEL.tryBinaryOps(tokens, EMPTY_LIST, precedence, stopOps);
		}

		const list: JelNode[] = [];
		while (true) {
			list.push(JEL.parseExpression(tokens, PARENS_PRECEDENCE, LIST_ENTRY_STOP));
			if (JEL.expectOp(tokens, LIST_ENTRY_STOP, "Expecting comma or end of list").value == ']')
				return JEL.tryBinaryOps(tokens, new List(list), precedence, stopOps);
		}
	}

	
	static parseParameters(tokens: TokenReader, precedence: number, stop: any, terminator: string, errorNoEnd: string, errorParamName: string): Assignment[] {
		const assignments: Assignment[] = [];
		while (true) {
			const name = JEL.nextOrThrow(tokens, `Expected identifier for ${errorParamName}.`);
			if (name.type != TokenType.Identifier)
				JEL.throwParseException(name || tokens.last(), `Expected identifier for ${errorParamName}.`);
			if (/(^_$)|::/.test(name.value))
				JEL.throwParseException(name || tokens.last(), `Illegal name ${name.value}, a ${errorParamName} must not contain a double-colon ('::') or be the underscore.`);
			const eq = JEL.expectOp(tokens, EQUAL, "Expected equal sign after variable name.");
			const expression = JEL.parseExpression(tokens, precedence, stop);
			if (!expression)
				JEL.throwParseException(eq, "Expression ended unexpectedly.");
			assignments.push(new Assignment(name.value, expression));
			const terminatorToken = JEL.expectOp(tokens, stop, errorNoEnd);
			if (terminatorToken.value == terminator)
				return assignments;
		}
	}
   
  // called after an potential left operand for a binary op (or function call, or '?')
  static tryBinaryOps(tokens: TokenReader, left: JelNode, precedence: number, stopOps: any): JelNode {
    if (!tokens.hasNext())
      return left;

    const binOpToken = tokens.peek();
    if (binOpToken.type != TokenType.Operator) {
      if (stopOps.identifier)
        return left;
      JEL.throwParseException(binOpToken, "Expected operator");
    }
    
    if (stopOps[binOpToken.value])
       return left;
    
    const opPrecedence = binaryOperators[binOpToken.value] as number;
    if (!opPrecedence)
      JEL.throwParseException(binOpToken, `Unexpected operator "${binOpToken.value}"`);
    
    if (opPrecedence <= precedence)
      return left;
    
    tokens.next();
    
    if (binOpToken.value == '.' && tokens.peekIs(TokenType.Identifier) && tokens.peekIs(TokenType.Operator, '(', 1)) {
      const methodName = tokens.next();
      tokens.next(); 
      return JEL.tryBinaryOps(tokens, JEL.parseCall(tokens, left, methodName.value), precedence, stopOps);
    }
    
    switch (binOpToken.value) {
      case '(': 
        return JEL.tryBinaryOps(tokens, JEL.parseCall(tokens, left), precedence, stopOps);
      case '[': 
        return JEL.tryBinaryOps(tokens, JEL.parseGet(tokens, left), precedence, stopOps);
      case 'instanceof': 
        return JEL.tryBinaryOps(tokens, new InstanceOf(left, JEL.parseExpression(tokens, binaryOperators['instanceof'] as number, stopOps)), precedence, stopOps);
      case 'as': 
        return JEL.tryBinaryOps(tokens, new As(left, JEL.parseExpression(tokens, binaryOperators['as'] as number, stopOps)), precedence, stopOps);
      case '...':
        return JEL.tryBinaryOps(tokens, new Range(left, JEL.parseExpression(tokens, binaryOperators['...'] as number, stopOps)), precedence, stopOps);
      case '?':
        return JEL.tryBinaryOps(tokens, new Optional(left), precedence, stopOps);
      case '[]':
        return JEL.tryBinaryOps(tokens, new ListType(left), precedence, stopOps);
      case '{}':
        return JEL.tryBinaryOps(tokens, new DictType(left), precedence, stopOps);
      case '<>':
        return JEL.tryBinaryOps(tokens, new Rangable(left), precedence, stopOps);
      case '|': 
        const elements: JelNode[] = [left, JEL.parseExpression(tokens, binaryOperators[binOpToken.value] as number, stopOps)];
        while (tokens.hasNext(2) && tokens.nextIf(TokenType.Operator, '|'))
          elements.push(JEL.parseExpression(tokens, binaryOperators[binOpToken.value] as number, stopOps));

        return JEL.tryBinaryOps(tokens, new Options(elements), precedence, stopOps);
      default:
        return JEL.tryBinaryOps(tokens, new Operator(binOpToken.value, left, JEL.parseExpression(tokens, binaryOperators[binOpToken.value] as number, stopOps)), precedence, stopOps);
    }
  }

  static checkTypedParameters(args: TypedParameterDefinition[]|null|undefined, token: Token): any {
    if (!args)
      return args;
		const usedNames: any = new Set();
    args.forEach(arg=>{
      if (usedNames.has(arg.name))
        JEL.throwParseException(token, `Duplicate key in lambda: ${arg.name}`);
      if (arg.name == 'this')
        JEL.throwParseException(token, `The argument 'this' must not be defined explicitly.`);
      if (arg.name == 'super')
        JEL.throwParseException(token, `The argument 'super' must not be defined explicitly.`);
      usedNames.add(arg.name);
    });
    return args;
  }
  
  
  // Tries to parse a list of lambda/function arguments. Returns undefined if it is not a possible lambda expression.
 	static  tryParseTypedParameters(tokens: TokenReader, precedence: number, stopOps: any): TypedParameterDefinition[] | undefined {
		if (tokens.peekIs(TokenType.Operator, ')')) {
			tokens.next();
			return [];
		}

		const args: TypedParameterDefinition[] = [];
		while (true) {
			const name = JEL.nextOrThrow(tokens, "Unexpected end of expression");
			if (name.type != TokenType.Identifier)
				return undefined;

      const separator = JEL.nextOrThrow(tokens, "Unexpected end of expression.");
      if (separator.type != TokenType.Operator)
        return undefined;

 			if (separator.value == '=') {
        args.push(new TypedParameterDefinition(name.value, JEL.parseExpression(tokens, PARENS_PRECEDENCE, LAMBDA_VALUE_STOP)));
				if (JEL.expectOp(tokens, LAMBDA_VALUE_STOP, "Expecting comma or end of lambda arguments").value == ')')
					return args;
      }
			else if (separator.value == ':') {
        const typeDef = JEL.parseExpression(tokens, PARENS_PRECEDENCE, LAMBDA_TYPE_STOP);

        const separator2 = JEL.expectOp(tokens, LAMBDA_TYPE_STOP, "Expecting comma, default value or end of lambda arguments")
        if (separator2.value == '=') {
          args.push(new TypedParameterDefinition(name.value, JEL.parseExpression(tokens, PARENS_PRECEDENCE, LAMBDA_VALUE_STOP), typeDef));
          const separator3 = JEL.expectOp(tokens, LAMBDA_VALUE_STOP, "Expecting command or end of lambda arguments");
          if (separator3.value == ')')
            return args;
        }
        else {
          args.push(new TypedParameterDefinition(name.value, undefined, typeDef));
          if (separator2.value == ')')
            return args;
        }
			}
			else if (separator.value == ',' || separator.value == ')') {
				args.push(new TypedParameterDefinition(name.value));
				if (separator.value == ')')
					return args;
			}
      else
         return undefined;
		}
	}
  
  static tryParseAsTypeCheck(tokens: TokenReader, precedence: number, stopOps: any): JelNode | undefined {
    if (!tokens.nextIf(TokenType.Operator, 'as'))
      return undefined;
    
    return JEL.parseExpression(tokens, precedence, stopOps);
  }
  
  static tryLambda(tokens: TokenReader, argName: string | null, precedence: number, stopOps: any): Lambda | undefined {
    if (stopOps['=>'])
      return undefined;
    
    const tok = tokens.copy();
    if (argName) {
      if (!tok.nextIf(TokenType.Operator, '=>'))
        return undefined;

 			if (argName == 'this' || argName == 'super')
				JEL.throwParseException(tokens.last(), `The arguments 'this' and 'super' must not be defined explicitly.`);
      
      TokenReader.copyInto(tok, tokens);
      return new Lambda([new TypedParameterDefinition(argName)], undefined, JEL.parseExpression(tokens, precedence, stopOps));
    }
    else {
      if (!tok.hasNext())
        return undefined;

      const args: TypedParameterDefinition[]|undefined = JEL.tryParseTypedParameters(tok, precedence, stopOps);
			if (!args)
        return undefined;
      const asCheck = JEL.tryParseAsTypeCheck(tok, precedence, Object.assign({'=>': true}, stopOps));
      if (!tok.peekIs(TokenType.Operator, '=>'))
        return undefined;
      JEL.checkTypedParameters(args, tok.next());     
      
      TokenReader.copyInto(tok, tokens);
      return new Lambda(args, asCheck, JEL.parseExpression(tokens, precedence, stopOps));
    }
  }
  
  
  static parseClass(tokens: TokenReader, precedence: number, stopOps: any): ClassDef {
    const classExpressionStop: any = Object.assign(CLASS_EXPRESSION_STOP, stopOps);
    const classTypeExpressionStop: any = Object.assign(CLASS_TYPE_EXPRESSION_STOP, stopOps);
    const className = JEL.nextOrThrow(tokens, "Expected identifier after 'class' declaration");
    if (className.type != TokenType.Identifier)
      JEL.throwParseException(className, "Expected identifier after 'class' declaration");

    const superType: JelNode|undefined = (tokens.peekIs(TokenType.Identifier, 'extends')) ? tokens.next() && JEL.parseExpression(tokens, CLASS_PRECEDENCE, CLASS_EXTENDS_STOP) : undefined;
    
    tokens.nextIf(TokenType.Operator, ':');
    
    let ctor: Lambda|undefined = undefined;
    const propertyDefs: TypedParameterDefinition[] = [];
    const methods: Assignment[] = [];
    const getters: Assignment[] = [];
    const staticProperties: Assignment[] = [];
    
    const propertyNames = new Set();
    
    while (true) {
      const peek = tokens.peek();
      if (!peek || (peek.type == TokenType.Operator && stopOps[peek.value]))
        return new ClassDef(className.value, superType, ctor, propertyDefs, methods, getters, staticProperties);
      tokens.next();
      
      const staticModifier = peek.is(TokenType.Identifier, 'static');
      const next = staticModifier ? tokens.next() : peek;
      
      if (next.is(TokenType.Identifier, 'constructor') && tokens.nextIf(TokenType.Operator, '(')) {
        
        const args = JEL.checkTypedParameters(JEL.tryParseTypedParameters(tokens, CLASS_PRECEDENCE, NO_STOP), next);
        if (args == null)
          JEL.throwParseException(tokens.last(), `Can not parse argument list for constructor`);
        tokens.nextIf(TokenType.Operator, ':');
        ctor = new Lambda(args!, undefined, JEL.parseExpression(tokens, CLASS_PRECEDENCE, classExpressionStop));
      }
      else if (next.is(TokenType.Identifier, 'get') && tokens.peekIs(TokenType.Identifier)) { // getter
        if (staticModifier)
          JEL.throwParseException(next, `Static getters are not supported.`);
        
        const propertyName = tokens.next().value;
        if (propertyNames.has(propertyName))
          JEL.throwParseException(tokens.last(), `Property ${propertyName} is already declared`);
        propertyNames.add(propertyName);
        JEL.expectOp(tokens, OPEN_ARGS, `Expected '()' following declaration of getter`);
        JEL.expectOp(tokens, CLOSE_ARGS, `Expected '()' following declaration of getter. Getters can't take any arguments.`);
        const asCheck = JEL.tryParseAsTypeCheck(tokens, precedence, COLON);
        tokens.nextIf(TokenType.Operator, ':');
        getters.push(new Assignment(propertyName, new Lambda([], asCheck, JEL.parseExpression(tokens, CLASS_PRECEDENCE, classExpressionStop))));
      }
      else if ((next.is(TokenType.Identifier, 'op') ||  next.is(TokenType.Identifier, 'singleOp')) && tokens.peekIs(TokenType.Operator) && !tokens.peekIs(TokenType.Operator, '(')) { // ops
        if (staticModifier)
          JEL.throwParseException(next, `Operator methods can not be combined with a 'static' modifier.`);
        const op = tokens.next().value;
        if (propertyNames.has(op))
          JEL.throwParseException(tokens.last(), `Operator ${op} already declared`);
        propertyNames.add(op);
        if (next.value == 'op' && !overloadableOperators[op])
          JEL.throwParseException(tokens.last(), `Binary operator ${op} can not be overloaded`);
        if (next.value == 'singleOp' && !overloadableSingleOps[op])
          JEL.throwParseException(tokens.last(), `Unary operator ${op} can not be overloaded`);

        const methodName = next.value + op;
        JEL.expectOp(tokens, OPEN_ARGS, `Expected '(' following declaration of operator overloading method`);
        const args = JEL.checkTypedParameters(JEL.tryParseTypedParameters(tokens, CLASS_PRECEDENCE, NO_STOP), next);
        if (args == null)
          JEL.throwParseException(tokens.last(), `Can not parse argument list for operator overload ${methodName}`);
        const argsMax = next.value == 'op' ? 1 : 0;
        if (args!.length > argsMax)
          JEL.throwParseException(tokens.last(), argsMax == 0 ? `Single operator overload ${methodName} must not take any arguments` : `Too many arguments for operator overload ${methodName}, can have only one.`);

        const asCheck = JEL.tryParseAsTypeCheck(tokens, precedence, COLON);
        tokens.nextIf(TokenType.Operator, ':');
        methods.push(new Assignment(methodName, new Lambda(args!, asCheck, JEL.parseExpression(tokens, CLASS_PRECEDENCE, classExpressionStop))));
      }
      else if (next.is(TokenType.Identifier) && tokens.nextIf(TokenType.Operator, '(')) {
        
        const methodName = next.value;
        if (propertyNames.has(methodName))
          JEL.throwParseException(tokens.last(), `Method ${methodName} already declared`);
        propertyNames.add(methodName);
        const args = JEL.checkTypedParameters(JEL.tryParseTypedParameters(tokens, CLASS_PRECEDENCE, NO_STOP), next);
        if (args == null)
          JEL.throwParseException(tokens.last(), `Can not parse argument list for method ${methodName}`);
        const asCheck = JEL.tryParseAsTypeCheck(tokens, precedence, COLON);
        tokens.nextIf(TokenType.Operator, ':');
        const lambda = new Lambda(args!, asCheck, JEL.parseExpression(tokens, CLASS_PRECEDENCE, classExpressionStop));
        if (staticModifier)
          staticProperties.push(new Assignment(methodName, lambda));
        else
          methods.push(new Assignment(methodName, lambda));
      }
      else if (next.is(TokenType.Identifier) && (tokens.peekIs(TokenType.Operator, ':') || tokens.peekIs(TokenType.Operator, '='))) {
        const propertyName = next.value;
        if (propertyNames.has(propertyName))
          JEL.throwParseException(tokens.last(), `Property ${propertyName} is already declared`);
        propertyNames.add(propertyName);
        
        const separator = tokens.next();
        
        let arg;
        if (separator.value == '=')
          arg = new TypedParameterDefinition(propertyName, JEL.parseExpression(tokens, CLASS_PRECEDENCE, classExpressionStop));
        else {
          if (staticModifier)
            JEL.throwParseException(next, 'You must not set the type of a static property. Only a value is allowed.');
          const typeDef = JEL.parseExpression(tokens, CLASS_PRECEDENCE, classTypeExpressionStop);
          const value = tokens.peekIs(TokenType.Operator, '=') ? JEL.parseExpression(tokens, CLASS_PRECEDENCE, classExpressionStop) : undefined;
          arg = new TypedParameterDefinition(propertyName, value, typeDef);
        }
        
        if (staticModifier)
          staticProperties.push(new Assignment(arg.name, arg.defaultValue!));
        else
          propertyDefs.push(arg);
      }
      else
        JEL.throwParseException(next, 'Unexpected token in class declaration. Expected an identifier to define a method or property.');
    }
  }
  
  
  
  
  static parseCall(tokens: TokenReader, left: JelNode, methodName?: string): JelNode {
    const argList: JelNode[] = [];

    if (tokens.nextIf(TokenType.Operator, ')')) 
        return methodName ? new MethodCall(left, methodName, argList) : new Call(left, argList);
    
    while (!(tokens.peekIs(TokenType.Identifier) && tokens.peekIs(TokenType.Operator, '=', 1))) {
      argList.push(JEL.parseExpression(tokens, PARENS_PRECEDENCE, PARAMETER_STOP));
      
      const separator = JEL.expectOp(tokens, PARAMETER_STOP, "Expected ')' or ','");
      if (separator.value == ')')
        return methodName ? new MethodCall(left, methodName, argList) : new Call(left, argList);
    }
 
    const argNames = new Set();           // for tracking dupes
    const namedArgs: Assignment[] = []; // for the actual values
    while (true) {
      const name = JEL.nextOrThrow(tokens, "Expected identifier for named argument");
      if (name.type != TokenType.Identifier)
        JEL.throwParseException(name, "Expected identifier for named argument");
      if (argNames.has(name.value))
        JEL.throwParseException(name, "Duplicate name in named arguments");
      JEL.expectOp(tokens, EQUAL, "Expected equal sign after identifier for named argument");
      argNames.add(name.value);
      namedArgs.push(new Assignment(name.value, JEL.parseExpression(tokens, PARENS_PRECEDENCE, PARAMETER_STOP)));

      const next = JEL.expectOp(tokens, PARAMETER_STOP, "Expected ')' or '='");
      if (next.value == ')')
        break;
    }
    return methodName ? new MethodCall(left, methodName, argList, namedArgs) : new Call(left, argList, namedArgs);
  }
  
  static parseGet(tokens: TokenReader, left: JelNode): Get {
    const nameExp = JEL.parseExpression(tokens, PARENS_PRECEDENCE, SQUARE_BRACE_STOP);
    JEL.expectOp(tokens, SQUARE_BRACE_STOP, "Closing square bracket");
    return new Get(left, nameExp);
  }
  
  static expectOp(tokens: TokenReader, allowedTypes: any, msg?: string): Token {
    const op = JEL.nextOrThrow(tokens, msg || "Expected operator, but expression ended");
    if (op.type != TokenType.Operator || !(op.value in allowedTypes))
      JEL.throwParseException(tokens.last(), msg || "Expected operator");
    return op;
  }
 
  static createPattern(value: string, jelToken?: Token): any {
		const t = jelToken || new Token(1, 1, TokenType.Pattern, value);
    return BaseTypeRegistry.get('Pattern').valueOf(PatternParser.parsePattern(Tokenizer.tokenizePattern(t.line, t.column, value), t)!, value);
  }
  
	

  static execute(txt: string, ctx: Context): Promise<any> {
    return new JEL(txt).execute(ctx);
  }

  static parseTree(txt: string): JelNode {
    return new JEL(txt).parseTree;
  }

}

