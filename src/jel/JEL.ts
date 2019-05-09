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
import EnumDef from './expressionNodes/EnumDef';
import Literal from './expressionNodes/Literal';
import Fraction from './expressionNodes/Fraction';
import ExpressionPattern from './expressionNodes/Pattern';
import Variable from './expressionNodes/Variable';
import VariableOrType from './expressionNodes/VariableOrType';
import TemplateString from './expressionNodes/TemplateString';
import Operator from './expressionNodes/Operator';
import List from './expressionNodes/List';
import ListType from './expressionNodes/ListType';
import NativeFunction from './expressionNodes/NativeFunction';
import DictType from './expressionNodes/DictType';
import Rangable from './expressionNodes/Rangable';
import Range from './expressionNodes/Range';
import In from './expressionNodes/In';
import Dictionary from './expressionNodes/Dictionary';
import Translator from './expressionNodes/Translator';
import Reference from './expressionNodes/Reference';
import Condition from './expressionNodes/Condition';
import TypedParameterDefinition from './expressionNodes/TypedParameterDefinition';
import Assignment from './expressionNodes/Assignment';
import DynamicAssignment from './expressionNodes/DynamicAssignment';
import MethodDef from './expressionNodes/MethodDef';
import PropertyDef from './expressionNodes/PropertyDef';
import PatternAssignment from './expressionNodes/PatternAssignment';
import Let from './expressionNodes/Let';
import With from './expressionNodes/With';
import Lambda from './expressionNodes/Lambda';
import Call from './expressionNodes/Call';
import MethodCall from './expressionNodes/MethodCall';
import Optional from './expressionNodes/Optional';
import Options from './expressionNodes/Options';
import Get from './expressionNodes/Get';
import UnitValue from './expressionNodes/UnitValue';
import As from './expressionNodes/As';
import InstanceOf from './expressionNodes/InstanceOf';
import TryElement from './expressionNodes/TryElement';
import Try from './expressionNodes/Try';
import TryWhen from './expressionNodes/TryWhen';
import TryCatch from './expressionNodes/TryCatch';
import TryIf from './expressionNodes/TryIf';
import TryElse from './expressionNodes/TryElse';

const binaryOperators: any = { // op->precedence
  '.': 50,
  '.?': 50,
  '?': 40,
  '<>': 40,
  '[]': 40,
  '{}': 40,
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
  'in': 16,
	'^': 15,
  '+-': 19, 
  '...': 17,
  '(': 25,
  '[': 25,
  '{': 25
};
const unaryOperators: any = { // op->precedence
  '-': 18,
  '+': 18,
  '!': 18,
  '>=': 18,
  '<=': 18,
  '>': 18,
  '<': 18
};

const overloadableOperators: any = {'+': true, '-': true, '*': true, '/': true, '%': true, '==': true, '===': true, '!=': true, '!==': true, '<': true, '<<': true, '<=': true, '<<=': true, '>': true, '>>': true, '>=': true, '>>=': true, '^': true};
const overloadableSingleOps: any = {'+': true, '-': true, '!': true};

const IF_PRECEDENCE = 4; 
const TRY_PRECEDENCE = 4; 
const PARENS_PRECEDENCE = 4; 
const LET_PRECEDENCE = 4; 
const WITH_PRECEDENCE = 4; 
const CLASS_PRECEDENCE = 4; 

const NO_STOP = {};
const PARENS_STOP = {')': true};
const SQUARE_BRACE_STOP = {']': true};
const LIST_ENTRY_STOP = {']': true, ',': true};
const DICT_KEY_STOP = {':': true, '}': true, ',': true};
const DICT_VALUE_STOP = {',': true, '}': true};
const LAMBDA_TYPE_STOP = {',': true, '=': true, ')': true};
const LAMBDA_VALUE_STOP = {',': true, ')': true};
const TRANSLATOR_META_STOP = {',': true, ':': true, '=': true};
const TRANSLATOR_META_VALUE_STOP = {',': true, ':': true};
const TRANSLATOR_PATTERN_STOP = {'=>': true};
const TRANSLATOR_LAMBDA_STOP = {',': true, '}': true};
const PARAMETER_STOP: any = {')': true, ',': true};
const IF_STOP = {'then': true, ':': true};
const THEN_STOP: any = {'else': true, 'let': true, 'with': true, 'if': true, 'class': true, 'enum': true, 'try': true, 'throw': true, abstract: true, static: true, native: true, override: true, private: true};
const ELSE_STOP: any = {'else': true, 'let': true, 'with': true, 'if': true, 'class': true, 'enum': true, 'try': true, 'throw': true};
const LET_STOP = {':': true, ',': true};
const WITH_STOP = {':': true, ',': true};
const TRY_STOP = {':': true};
const TRY_ELEMENT_STOP = {'when': true, 'catch': true, 'else': true, 'if': true};
const CLASS_EXTENDS_STOP = {':': true, ',': true, identifier: true, abstract: true, static: true, native: true, override: true, private: true};
const CLASS_EXPRESSION_STOP = {identifier: true, abstract: true, static: true, native: true, override: true, private: true};
const CLASS_TYPE_EXPRESSION_STOP = {'=': true, identifier: true, abstract: true, static: true, native: true, override: true, private: true};

const EQUAL = {'=': true};
const LAMBDA = {'=>': true};
const OPEN_ARGS = {'(': true};
const CLOSE_ARGS = {')': true};

const CLASS_MEMBER_MODIFIERS: any = {abstract: true, native: true, override: true, private: true, static: true};

const DUMMY_TOKEN = new Token(0, 0, '(you should never see this)', TokenType.Literal, null);
const EMPTY_LIST = new List(DUMMY_TOKEN, []);
const EMPTY_DICT = new Dictionary(DUMMY_TOKEN, []);
const TRUE_LITERAL = new Literal(DUMMY_TOKEN, true);

export default class JEL {
	parseTree: JelNode;
	
  constructor(input: string, src: string = "(inline)") {
    this.parseTree = JEL.parseExpression(Tokenizer.tokenize(input, src));
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
	 
	static nextIsOrThrow(tokens: TokenReader, type: TokenType, msg: string): Token {
    return JEL.nextIsValueOrThrow(tokens, type, undefined, msg);
	}

 	static nextIsValueOrThrow(tokens: TokenReader, type: TokenType, value: string|undefined, msg: string): Token {
		if (tokens.peekIs(type, value))
			return tokens.next();
		JEL.throwParseException(tokens.last(), msg);
		return undefined as any; // just to make Typescript happy
	}

  
  static parseExpression(tokens: TokenReader, precedence = 0, stopOps = NO_STOP, isTypeDef=false): JelNode {
    const token = JEL.nextOrThrow(tokens, "Unexpected end, expected another token");
    switch (token.type) {
    case TokenType.Literal:
			if (typeof token.value == 'number' && tokens.peekIs(TokenType.Operator, '@'))
				return JEL.parseUnitValue(tokens, new Literal(token, token.value), precedence, stopOps);
			else
	      return JEL.tryBinaryOps(tokens, new Literal(token, token.value), precedence, stopOps);
    case TokenType.TemplateString:
        return JEL.tryBinaryOps(tokens, JEL.parseTemplateString(token), precedence, stopOps);
    case TokenType.Fraction:
			if (tokens.peekIs(TokenType.Operator, '@'))
				return JEL.parseUnitValue(tokens, new Fraction(token, (token as FractionToken).numerator, (token as FractionToken).denominator), precedence, stopOps);
			else
	      return JEL.tryBinaryOps(tokens, new Fraction(token, (token as FractionToken).numerator, (token as FractionToken).denominator), precedence, stopOps);
    case TokenType.Identifier:
      const lambda = JEL.tryLambda(tokens, token.value, precedence, stopOps);
      return JEL.tryBinaryOps(tokens, lambda || (isTypeDef && /^[A-Z]/.test(token.value)? new VariableOrType(token, token.value) : new Variable(token, token.value)), precedence, stopOps);
    case TokenType.Pattern:
      return JEL.tryBinaryOps(tokens, new ExpressionPattern(token, JEL.createPattern(token.value, token)), precedence, stopOps);
    case TokenType.Operator:
      if (unaryOperators[token.value]) 
        return JEL.parseUnaryOperator(tokens, token.value, precedence, stopOps);
      else 
        return JEL.parseOperatorExpression(tokens, token.value, precedence, stopOps);
    default:
      JEL.throwParseException(token, "Unexpected token");
    }
		return undefined as any; // this is a dummy return to make Typescript happy
  }

  static parseTemplateString(stringToken: Token): Literal | TemplateString {
    const stringTokens = Tokenizer.tokenizeTemplateString(stringToken.line, stringToken.column, stringToken.src, stringToken.value);
    const fragments = [];
    const expressions = [];
    while (true) {
      const token = stringTokens.next();
      if (!token)
        break;
  
      if (token.type == TokenType.StringFragment)
          fragments.push(token.value);
      else if (token.type == TokenType.Expression) {
          if (fragments.length <= expressions.length)
            fragments.push('');
          expressions.push(JEL.parseExpression(Tokenizer.tokenize(token.value)));
      }
      else
        JEL.throwParseException(token, "Unexpected token " + token.type);
    }
    
    if (!expressions.length)
      return new Literal(stringToken, fragments.join(''));
    
    if (fragments.length == expressions.length)
      fragments.push('');

    return new TemplateString(stringToken, fragments, expressions);
  }

  
  static parseUnaryOperator(tokens: TokenReader, operator: string, precedence: number, stopOps: any): JelNode {
    if ((operator == '-' || operator == '+') && ((tokens.peekIs(TokenType.Literal) && typeof tokens.peek().value == 'number')  || tokens.peekIs(TokenType.Fraction))) {
      const number = tokens.next();
      const node = number.type == TokenType.Literal ? new Literal(number, operator == '-' ? -number.value : number.value) : 
        new Fraction(number, (number as FractionToken).numerator * (operator == '-' ? -1 : 1), (number as FractionToken).denominator);

      if (tokens.peekIs(TokenType.Operator, '@'))
        return JEL.parseUnitValue(tokens, node, precedence, stopOps);
      else
        return JEL.tryBinaryOps(tokens, node, precedence, stopOps);
    }
    switch (operator) {
      case ">=":
        return JEL.tryBinaryOps(tokens, new Range(tokens.last(), JEL.parseExpression(tokens, unaryOperators[operator], stopOps), undefined), precedence, stopOps);
      case "<=":
        return JEL.tryBinaryOps(tokens, new Range(tokens.last(), undefined, JEL.parseExpression(tokens, unaryOperators[operator], stopOps)), precedence, stopOps);
      case ">":
        return JEL.tryBinaryOps(tokens, new Range(tokens.last(), JEL.parseExpression(tokens, unaryOperators[operator], stopOps), undefined, true, false), precedence, stopOps);
      case "<":
        return JEL.tryBinaryOps(tokens, new Range(tokens.last(), undefined, JEL.parseExpression(tokens, unaryOperators[operator], stopOps), false, true), precedence, stopOps);
      default:
        return JEL.tryBinaryOps(tokens, new Operator(tokens.last(),  operator, JEL.parseExpression(tokens, unaryOperators[operator], stopOps)), precedence, stopOps);
    }
  }
  
static parseOperatorExpression(tokens: TokenReader, operator: string, precedence: number, stopOps: any): JelNode {
    const firstToken = tokens.last();
    switch (operator) {
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
        return JEL.parseList(tokens, precedence, stopOps);
    case '{':
        return JEL.parseDictionary(tokens, precedence, stopOps);
    case '[]':
        return JEL.tryBinaryOps(tokens, EMPTY_LIST, precedence, stopOps);
    case '{}':
        return JEL.tryBinaryOps(tokens, EMPTY_DICT, precedence, stopOps);
    case '${': 
        return JEL.parseTranslator(tokens, precedence, stopOps);
    case '@': 
      const t2 = JEL.nextIsOrThrow(tokens, TokenType.Identifier, "Expected identifier after '@' for reference.");
      return JEL.tryBinaryOps(tokens, new Reference(t2, t2.value), precedence, stopOps);
    case 'if':
      const cond = JEL.parseExpression(tokens, IF_PRECEDENCE, IF_STOP);
      JEL.expectOp(tokens, IF_STOP, "Expected 'then' or ':' to end 'if' condition");
      const allStop = Object.assign({}, THEN_STOP, stopOps);
      const thenV = JEL.parseExpression(tokens, IF_PRECEDENCE, allStop);
      if (tokens.peekIs(TokenType.Operator) && (tokens.nextIf(TokenType.Operator, 'else') || ELSE_STOP[tokens.peek().value])) {
        tokens.nextIf(TokenType.Operator, ':');
        return JEL.tryBinaryOps(tokens, new Condition(firstToken, cond, thenV, JEL.parseExpression(tokens, IF_PRECEDENCE, stopOps)), precedence, stopOps);
      }
      else
        return JEL.tryBinaryOps(tokens, new Condition(firstToken, cond, thenV, TRUE_LITERAL), precedence, stopOps);
    case 'let':
      const assignments: Assignment[] = JEL.parseParameters(tokens, LET_PRECEDENCE, LET_STOP, ':', "Expected colon or equal sign after expression in 'let' statement,", 'constant');
      return JEL.tryBinaryOps(tokens, new Let(firstToken, assignments, JEL.parseExpression(tokens, LET_PRECEDENCE, stopOps)), precedence, stopOps);
    case 'with':
      const assertions: JelNode[] = JEL.parseListOfExpressions(tokens, WITH_PRECEDENCE, WITH_STOP, ':', "Expected colon after last expression in 'with' assertion");
      return JEL.tryBinaryOps(tokens, new With(firstToken, assertions, JEL.parseExpression(tokens, WITH_PRECEDENCE, stopOps)), precedence, stopOps);
    case 'try':
      return JEL.tryBinaryOps(tokens, JEL.parseTryExpression(tokens, TRY_PRECEDENCE, stopOps), precedence, stopOps);
    case 'native':
    case 'abstract':
    case 'class':
      return JEL.tryBinaryOps(tokens, JEL.parseClass(tokens, precedence, stopOps), precedence, stopOps);
    case 'enum':
      return JEL.tryBinaryOps(tokens, JEL.parseEnum(tokens, precedence, stopOps), precedence, stopOps);
    default:
      JEL.throwParseException(firstToken, `Unexpected token while parsing operator "${operator}"`);
    }
		return undefined as any; // this is a dummy return to make Typescript happy
  }
  
	static parseDictionary(tokens: TokenReader, precedence: number, stopOps: any): JelNode {
    const firstToken = tokens.peek();
		if (tokens.nextIf(TokenType.Operator, '}'))
			return JEL.tryBinaryOps(tokens, EMPTY_DICT, precedence, stopOps);

		const assignments: Assignment[] = [];
		const dynAssignments: DynamicAssignment[] = [];
		const usedNames: any = new Set();
		while (true) {
			const name = JEL.nextOrThrow(tokens, "Unexpected end of dictionary");
			if (name.type != TokenType.Identifier && name.type != TokenType.Literal && name.type != TokenType.TemplateString)
				JEL.throwParseException(name, "Expected identifier or literal as dictionary key");
			if (usedNames.has(name.value))
				JEL.throwParseException(name, `Duplicate key in dictionary: ${name.value}`);
			usedNames.add(name.value);

			const separator = JEL.expectOp(tokens, DICT_KEY_STOP, "Expected ':', ',' or '}' in Dictionary.");
			if (separator.value == ':') {
        const nameExpr: Literal | TemplateString | Token = name.type != TokenType.TemplateString ? name : JEL.parseTemplateString(name);
        if (nameExpr instanceof TemplateString)
   				dynAssignments.push(new DynamicAssignment(separator, nameExpr, JEL.parseExpression(tokens, PARENS_PRECEDENCE, DICT_VALUE_STOP)));
        else
	  			assignments.push(new Assignment(separator, nameExpr.value, JEL.parseExpression(tokens, PARENS_PRECEDENCE, DICT_VALUE_STOP)));

				if (JEL.expectOp(tokens, DICT_VALUE_STOP, "Expecting comma or end of dictionary").value == '}' || tokens.nextIf(TokenType.Operator, '}'))
					return JEL.tryBinaryOps(tokens, new Dictionary(firstToken, assignments, dynAssignments), precedence, stopOps);
			}
			else { // short notation {a}
				if (name.type != TokenType.Identifier)
					JEL.throwParseException(separator, "Dictionary entries require a value, unless an identifier is used in the short notation;");
				assignments.push(new Assignment(name, name.value, new Variable(name, name.value)));
				if ((separator.value == '}') || (separator.value == ',' && tokens.nextIf(TokenType.Operator, '}')))
					return JEL.tryBinaryOps(tokens, new Dictionary(firstToken, assignments, dynAssignments), precedence, stopOps);
			 }
		}
	}
	
	static parseTranslator(tokens: TokenReader, precedence: number, stopOps: any): JelNode {
		if (tokens.nextIf(TokenType.Operator, '}'))
			return JEL.tryBinaryOps(tokens, new Translator(tokens.last()), precedence, stopOps);

		const assignments: PatternAssignment[] = [];

		while (true) {
			const metaAssignments: Assignment[] = [];

			const name = JEL.nextOrThrow(tokens, "Unexpected end of translator");
			if (name.type == TokenType.Identifier) {
				tokens.undo();

				while (true) {
					if (!tokens.hasNext()) 
						JEL.throwParseException(tokens.last(), "Expected identifier for translator meta");   // TODO: optimize using nextOrThrow???
					const name = tokens.next();
					if (name.type != TokenType.Identifier)
						JEL.throwParseException(name || tokens.last(), "Expected identifier for translator meta");
					const eq = JEL.expectOp(tokens, TRANSLATOR_META_STOP, "Expected equal sign or comma or colon after meta name");
					if (eq.value == '=') {
						const expression = JEL.parseExpression(tokens, PARENS_PRECEDENCE, TRANSLATOR_META_VALUE_STOP);
						if (!expression)
							JEL.throwParseException(eq, "Expression ended unexpectedly.");
						metaAssignments.push(new Assignment(eq, name.value, expression));

						const terminator = JEL.expectOp(tokens, TRANSLATOR_META_VALUE_STOP, "Expected colon or comma after expression in translator.");
						if (terminator.value == ':')
							break;
					}
					else {
						metaAssignments.push(new Assignment(name, name.value, TRUE_LITERAL));
						if (eq.value == ':')
							break;
					}
				}
			}

			const pattern = name.type == TokenType.Pattern ? name : JEL.nextIsOrThrow(tokens, TokenType.Pattern, "Unexpected end of translator");

			const keyPattern = JEL.createPattern(pattern.value, pattern);

			JEL.expectOp(tokens, TRANSLATOR_PATTERN_STOP, "Expected '=>' in Translator.");

			assignments.push(new PatternAssignment(pattern, keyPattern, JEL.parseExpression(tokens, precedence, TRANSLATOR_LAMBDA_STOP), metaAssignments));

			if (JEL.expectOp(tokens, TRANSLATOR_LAMBDA_STOP, "Expecting comma or end of translator").value == '}') {
				return JEL.tryBinaryOps(tokens, new Translator(pattern, assignments), precedence, stopOps);
			}
		}
	}
	
	static parseUnitValue(tokens: TokenReader, content: JelNode, precedence: number, stopOps: any) {
		const t1 = tokens.next();
		
		const t2 = JEL.nextIsOrThrow(tokens, TokenType.Identifier, "Expected identifier after '@' for reference / unit value.");
		return JEL.tryBinaryOps(tokens, new UnitValue(t1, content, t2.value), precedence, stopOps);
	}
	
	static parseList(tokens: TokenReader, precedence: number, stopOps: any): JelNode {
    const firstToken = tokens.last();
		const possibleEOL = tokens.peek();
		if (!possibleEOL)
			JEL.throwParseException(tokens.last(), "Unexpexted end, list not closed");
		if (possibleEOL.type == TokenType.Operator && possibleEOL.value == ']') {
			tokens.next();
			return JEL.tryBinaryOps(tokens, EMPTY_LIST, precedence, stopOps);
    }

    const list: JelNode[] = [];
		while (true) {
			list.push(JEL.parseExpression(tokens, PARENS_PRECEDENCE, LIST_ENTRY_STOP));
			if (JEL.expectOp(tokens, LIST_ENTRY_STOP, "Expecting comma or end of list").value == ']' || tokens.nextIf(TokenType.Operator, ']'))
				return JEL.tryBinaryOps(tokens, new List(firstToken, list), precedence, stopOps);
		}
	}
  
  static parseListOfExpressions(tokens: TokenReader, precedence: number, stopOps: any, terminator: string, errorMessage: string): JelNode[] {
		const list: JelNode[] = [];
		while (true) {
			list.push(JEL.parseExpression(tokens, precedence, stopOps));
			if (JEL.expectOp(tokens, stopOps, errorMessage).value == terminator)
				return list;
		}
	}

  static checkVarName(name: Token, errorParamName: string): void {
    if (/(^_$)|::/.test(name.value))
      JEL.throwParseException(name, `Illegal name ${name.value}, a ${errorParamName} must not contain a double-colon ('::') or be the underscore.`);
  }
	
	static parseParameters(tokens: TokenReader, precedence: number, stop: any, terminator: string, errorNoEnd: string, errorParamName: string): Assignment[] {
		const assignments: Assignment[] = [];
		while (true) {
			const name = JEL.nextIsOrThrow(tokens, TokenType.Identifier, `Expected identifier for ${errorParamName}.`);
			JEL.checkVarName(name, errorParamName);
			const eq = JEL.expectOp(tokens, EQUAL, `Expected equal sign after variable name.` + (tokens.peek().value == ':' ? ' Type annotations are not allowed here.': ''));
			const expression = JEL.parseExpression(tokens, precedence, stop);
			if (!expression)
				JEL.throwParseException(eq, "Expression ended unexpectedly.");
			assignments.push(new Assignment(eq, name.value, expression));
			const terminatorToken = JEL.expectOp(tokens, stop, errorNoEnd);
			if (terminatorToken.value == terminator)
				return assignments;
		}
	}
   
	static parseTryExpression(tokens: TokenReader, precedence: number, stopOps: any): JelNode {
    const startToken = tokens.last();
    let varName = null;
	  if (tokens.peekIs(TokenType.Identifier) && tokens.peekIs(TokenType.Operator, '=', 1)) {
      varName = tokens.next();
      tokens.next();
			JEL.checkVarName(varName, "variable name");
    }

    const expression = JEL.parseExpression(tokens, TRY_PRECEDENCE, TRY_ELEMENT_STOP);
    if (!expression)
      JEL.throwParseException(tokens.last(), "Try expression ended unexpectedly.");

    const stops = Object.assign({}, stopOps, TRY_ELEMENT_STOP);
    const elements: TryElement[] = []; 
    while (true) {
      const elType: Token = JEL.expectOp(tokens, TRY_ELEMENT_STOP, `'try' expression must be followed by 'when', 'catch', 'if' or 'else'.`);
      switch (elType.value) {
        case 'when': {
          const type = JEL.parseExpression(tokens, TRY_PRECEDENCE, TRY_STOP, true);
          JEL.expectOp(tokens, TRY_STOP, "Expected colon (':') after type definition of a 'try'/'when' clause");
          elements.push(new TryWhen(type, JEL.parseExpression(tokens, TRY_PRECEDENCE, TRY_ELEMENT_STOP)));
          break;
        }
        case 'catch': 
          if (tokens.nextIf(TokenType.Operator, ':'))
            elements.push(new TryCatch(undefined, JEL.parseExpression(tokens, TRY_PRECEDENCE, TRY_ELEMENT_STOP)));
          else {
            const type = JEL.parseExpression(tokens, TRY_PRECEDENCE, TRY_STOP, true);
            JEL.expectOp(tokens, TRY_STOP, "Expected colon (':') after type definition of a 'try'/'catch' clause");
            elements.push(new TryCatch(type, JEL.parseExpression(tokens, TRY_PRECEDENCE, TRY_ELEMENT_STOP)));
            break;
          }
        case 'if': {
          const condition = JEL.parseExpression(tokens, TRY_PRECEDENCE, IF_STOP);
          JEL.expectOp(tokens, IF_STOP, "Expected colon (':') or 'then' after condition of a 'try'/'if' clause");
          elements.push(new TryIf(condition, JEL.parseExpression(tokens, TRY_PRECEDENCE, TRY_ELEMENT_STOP)));
          break;
        }
        case 'else':
          tokens.nextIf(TokenType.Operator, ':');
          elements.push(new TryElse(JEL.parseExpression(tokens, TRY_PRECEDENCE, TRY_ELEMENT_STOP)));
      }
      if (!JEL.isOp(tokens, TRY_ELEMENT_STOP))
        break;
    }
    return new Try(startToken, varName ? varName.value : undefined, expression, elements);
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
    
    if ((binOpToken.value == '.' || binOpToken.value == '.?') && tokens.peekIs(TokenType.Identifier) && tokens.peekIs(TokenType.Operator, '(', 1)) {
      const methodName = tokens.next();
      tokens.next(); 
      return JEL.tryBinaryOps(tokens, JEL.parseCall(tokens, left, methodName.value, binOpToken.value == '.?'), precedence, stopOps);
    }
    
    switch (binOpToken.value) {
      case '(': 
        return JEL.tryBinaryOps(tokens, JEL.parseCall(tokens, left), precedence, stopOps);
      case '[': 
        return JEL.tryBinaryOps(tokens, JEL.parseGet(tokens, left), precedence, stopOps);
      case 'instanceof': 
        return JEL.tryBinaryOps(tokens, new InstanceOf(binOpToken, left, JEL.parseExpression(tokens, binaryOperators['instanceof'] as number, stopOps)), precedence, stopOps);
      case 'as': 
        return JEL.tryBinaryOps(tokens, new As(binOpToken, left, JEL.parseExpression(tokens, binaryOperators['as'] as number, stopOps)), precedence, stopOps);
      case 'in': 
        return JEL.tryBinaryOps(tokens, new In(binOpToken, left, JEL.parseExpression(tokens, binaryOperators['in'] as number, stopOps)), precedence, stopOps);
      case '...':
        return JEL.tryBinaryOps(tokens, new Range(binOpToken, left, JEL.parseExpression(tokens, binaryOperators['...'] as number, stopOps)), precedence, stopOps);
      case '?':
        return JEL.tryBinaryOps(tokens, new Optional(binOpToken, left), precedence, stopOps);
      case '[]':
        return JEL.tryBinaryOps(tokens, new ListType(binOpToken, left), precedence, stopOps);
      case '{}':
        return JEL.tryBinaryOps(tokens, new DictType(binOpToken, left), precedence, stopOps);
      case '<>':
        return JEL.tryBinaryOps(tokens, new Rangable(binOpToken, left), precedence, stopOps);
      case '|': 
        const elements: JelNode[] = [left, JEL.parseExpression(tokens, binaryOperators[binOpToken.value] as number, stopOps)];
        while (tokens.hasNext(2) && tokens.nextIf(TokenType.Operator, binOpToken.value))
          elements.push(JEL.parseExpression(tokens, binaryOperators[binOpToken.value] as number, stopOps));

        return JEL.tryBinaryOps(tokens, new Options(binOpToken, elements), precedence, stopOps);
      default:
        return JEL.tryBinaryOps(tokens, new Operator(binOpToken, binOpToken.value, left, JEL.parseExpression(tokens, binaryOperators[binOpToken.value] as number, stopOps)), precedence, stopOps);
    }
  }

  static checkTypedParameters(args: TypedParameterDefinition[]|null|undefined, token: Token): TypedParameterDefinition[]|null|undefined {
    if (!args)
      return args;
		const usedNames: any = new Set();
    args.forEach(arg=>{
      if (usedNames.has(arg.name))
        JEL.throwParseException(token, `Duplicate argument name: ${arg.name}`);
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
      const varArg = tokens.nextIf(TokenType.Operator, '...');
      
			const name = JEL.nextOrThrow(tokens, "Unexpected end of expression");
			if (name.type != TokenType.Identifier)
				return undefined;

      const separator = JEL.nextOrThrow(tokens, "Unexpected end of expression.");
      if (separator.type != TokenType.Operator)
        return undefined;

 			if (separator.value == '=') {
        args.push(new TypedParameterDefinition(separator, name.value, JEL.parseExpression(tokens, PARENS_PRECEDENCE, LAMBDA_VALUE_STOP), undefined, !!varArg));
				if (JEL.expectOp(tokens, LAMBDA_VALUE_STOP, "Expecting comma or end of lambda arguments").value == ')')
					return args;
      }
			else if (separator.value == ':') {
        const typeDef = JEL.parseExpression(tokens, PARENS_PRECEDENCE, LAMBDA_TYPE_STOP, true);

        const separator2 = JEL.expectOp(tokens, LAMBDA_TYPE_STOP, "Expecting comma, default value or end of lambda arguments")
        if (separator2.value == '=') {
          args.push(new TypedParameterDefinition(separator2, name.value, JEL.parseExpression(tokens, PARENS_PRECEDENCE, LAMBDA_VALUE_STOP), typeDef, !!varArg));
          const separator3 = JEL.expectOp(tokens, LAMBDA_VALUE_STOP, "Expecting command or end of lambda arguments");
          if (separator3.value == ')')
            return args;
        }
        else {
          args.push(new TypedParameterDefinition(separator2, name.value, undefined, typeDef, !!varArg));
          if (separator2.value == ')')
            return args;
        }
			}
			else if (separator.value == ',' || separator.value == ')') {
				args.push(new TypedParameterDefinition(separator, name.value, undefined, undefined, !!varArg));
				if (separator.value == ')')
					return args;
			}
      else
         return undefined;
		}
	}
  
  static tryParseLambdaTypeCheck(tokens: TokenReader, stopOps: any): TypedParameterDefinition | undefined {
    if (!tokens.nextIf(TokenType.Operator, ':'))
      return undefined;
    
    return new TypedParameterDefinition(tokens.last(), 'return', undefined, JEL.parseExpression(tokens, 0, stopOps, true));
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
      return new Lambda(tokens.peek(), [new TypedParameterDefinition(tok.last(), argName)], undefined, JEL.parseExpression(tokens, precedence, stopOps), false);
    }
    else {
      if (!tok.hasNext())
        return undefined;

      const args: TypedParameterDefinition[]|undefined = JEL.tryParseTypedParameters(tok, precedence, stopOps);
			if (!args)
        return undefined;
      const varArgPos = args.findIndex(a=>a.varArgs);
      if (varArgPos >= 0 && varArgPos != args.length-1)
        JEL.throwParseException(tokens.last(), `Varargs are only possible as last argument.`);
      const asCheck = JEL.tryParseLambdaTypeCheck(tok, LAMBDA);
      if (!tok.peekIs(TokenType.Operator, '=>'))
        return undefined;
      JEL.checkTypedParameters(args, tok.next());     
      
      TokenReader.copyInto(tok, tokens);
      return new Lambda(tokens.peek(), args, asCheck, JEL.parseExpression(tokens, precedence, stopOps), varArgPos >= 0);
    }
  }
  
  
  static parseClass(tokens: TokenReader, precedence: number, stopOps: any): ClassDef {
    const isNative = tokens.last().value == 'native' && !!JEL.nextIsValueOrThrow(tokens, TokenType.Operator, 'class', "Modifier 'native' must be followed by 'class'");
    const isAbstract = tokens.last().value == 'abstract' && !!JEL.nextIsValueOrThrow(tokens, TokenType.Operator, 'class', "Modifier 'abstract' must be followed by 'class'");
    const classToken = tokens.last();

    const classExpressionStop: any = Object.assign({}, CLASS_EXPRESSION_STOP, stopOps);
    const classTypeExpressionStop: any = Object.assign({}, CLASS_TYPE_EXPRESSION_STOP, stopOps);
    
    const className = JEL.nextIsOrThrow(tokens, TokenType.Identifier, "Expected identifier after 'class' declaration");
    const superType: JelNode|undefined = (tokens.peekIs(TokenType.Identifier, 'extends')) ? tokens.next() && JEL.parseExpression(tokens, CLASS_PRECEDENCE, CLASS_EXTENDS_STOP) : undefined;
    const selfArgs = [new TypedParameterDefinition(classToken, className.value)];
    
    tokens.nextIf(TokenType.Operator, ':');
    

    let ctor: Lambda|NativeFunction|undefined = undefined;
    const methods: MethodDef[] = [];
    const properties: PropertyDef[] = [];
    const staticProperties: PropertyDef[] = [];
    let hasNative = false;
    const propertyNames = new Set();
    const staticPropertyNames = new Set();
    
    while (true) {
      const peek = tokens.peek();
      if (!peek || (peek.type == TokenType.Operator && stopOps[peek.value])) 
        return new ClassDef(classToken, className.value, superType, ctor, properties, methods, staticProperties, isAbstract, hasNative);

      const modifiers = new Set();
      let p: Token = tokens.next();
      while (p && p.is(TokenType.Operator) && CLASS_MEMBER_MODIFIERS[p.value]) {
        if (modifiers.has(p.value))
          JEL.throwParseException(p, `Duplicate modifier ${p.value}.`);
        else
          modifiers.add(p.value);
        p = tokens.next();
      }

      if (!p)
        JEL.throwParseException(tokens.last(), `Unexpected end of file. Expected member after modifier.`);

      const abstractModifier = modifiers.has('abstract'), nativeModifier = modifiers.has('native'), staticModifier = modifiers.has('static'), 
            overrideModifier = modifiers.has('override'), privateModifier = modifiers.has('private');
      
      if (abstractModifier && (nativeModifier || overrideModifier))
        JEL.throwParseException(tokens.last(), `Native and/or override modifiers can not be combined with abstract modifier.`);
      if (privateModifier && (overrideModifier || abstractModifier))
        JEL.throwParseException(tokens.last(), `Private modifier can not be combined with override or abstract.`);
      if (abstractModifier && !isAbstract)
        JEL.throwParseException(tokens.last(), `Abstract members are only allowed in abstract classes.`);
      hasNative = hasNative || nativeModifier;
      
      const next: Token = p;
     
      if (next.is(TokenType.Identifier, 'constructor') && tokens.nextIf(TokenType.Operator, '(')) {
        if (ctor)
          JEL.throwParseException(next, `Constructor already defined. You can not define two constructors`);
        if (staticModifier)
          JEL.throwParseException(next, `Static constructors are not supported.`);
        if (abstractModifier)
          JEL.throwParseException(next, `Abstract constructors are not supported. You can make the whole class abstract.`);
        if (overrideModifier)
          JEL.throwParseException(next, `Constructors can not use the 'override' modifier.`);
        if (isNative && !nativeModifier)
          JEL.throwParseException(next, `A native class requires a native constructor, but this constructor does not have the native property.`);
        if (!isNative && nativeModifier)
          JEL.throwParseException(next, `A native constructor requires a native class, but the class has no 'native' modifier.`);
        
        const args = JEL.checkTypedParameters(JEL.tryParseTypedParameters(tokens, CLASS_PRECEDENCE, NO_STOP), next);
        if (args == null)
          JEL.throwParseException(tokens.last(), `Can not parse argument list for constructor`);
        else if (args!.find(a=>a.varArgs))
          JEL.throwParseException(tokens.last(), `Constructors do not support varargs.`);
        else if (nativeModifier)
          ctor = new NativeFunction(peek, 'create', className.value, true, args!);
        else if (tokens.nextIf(TokenType.Operator, '=>'))
          ctor = new Lambda(peek, args!, undefined, JEL.parseExpression(tokens, CLASS_PRECEDENCE, classExpressionStop), false);
        else
          ctor = new Lambda(peek, args!, undefined, EMPTY_DICT, false);
      }
      else if (next.is(TokenType.Identifier, 'get') && tokens.peekIs(TokenType.Identifier)) {
        if (staticModifier)
          JEL.throwParseException(next, `Static getters are not supported.`);
        if (abstractModifier)
          JEL.throwParseException(next, `Abstract getters are not supported.`);
        if (nativeModifier)
          JEL.throwParseException(next, `Native getters can not be declared in JEL. You need to declare them as regular properties.`);
        
        const propertyName = tokens.next().value;
        if (propertyNames.has(propertyName))
          JEL.throwParseException(tokens.last(), `Property ${propertyName} is already declared`);
        propertyNames.add(propertyName);
        JEL.expectOp(tokens, OPEN_ARGS, `Expected '()' following declaration of getter`);
        JEL.expectOp(tokens, CLOSE_ARGS, `Expected '()' following declaration of getter. Getters can't take any arguments.`);
        const asCheck = JEL.tryParseLambdaTypeCheck(tokens, LAMBDA);
        JEL.nextIsValueOrThrow(tokens, TokenType.Operator, '=>',  "Getter expression must be preceded by '=>'.");
        methods.push(new MethodDef(peek, propertyName, new Lambda(peek, [], asCheck, JEL.parseExpression(tokens, CLASS_PRECEDENCE, classExpressionStop), false), overrideModifier, nativeModifier, false, false, true));
      }
      else if ((next.is(TokenType.Identifier, 'op') ||  next.is(TokenType.Identifier, 'singleOp')) && tokens.peekIs(TokenType.Operator) && !tokens.peekIs(TokenType.Operator, '(')) {
        if (staticModifier)
          JEL.throwParseException(next, `Operator methods can not be combined with a 'static' modifier.`);
        if (abstractModifier)
          JEL.throwParseException(next, `Operator methods can not be combined with an 'abstract' modifier.`);
        if (overrideModifier)
          JEL.throwParseException(next, `Operator methods can not use the 'override' modifier. They will always implicily override.`);
        if (nativeModifier)
          JEL.throwParseException(next, `Native operators can not be declared in JEL. You need to override the operator methods directly.`);
        if (isNative)
          JEL.throwParseException(next, `You can not overload operators with JEL in a native class.`);
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
        else if (args!.find(a=>a.varArgs))
          JEL.throwParseException(tokens.last(), `Operators do not support varargs.`);
        const argsMax = next.value == 'op' ? 1 : 0;
        if (args!.length > argsMax)
          JEL.throwParseException(tokens.last(), argsMax == 0 ? `Single operator overload ${methodName} must not take any arguments` : `Too many arguments for operator overload ${methodName}, can have only one.`);

        const asCheck = JEL.tryParseLambdaTypeCheck(tokens, LAMBDA);
        const lambdaToken = JEL.nextIsValueOrThrow(tokens, TokenType.Operator, '=>',  "Operator expression must be preceded by '=>'.");
        methods.push(new MethodDef(peek, methodName, new Lambda(lambdaToken, args!, asCheck, JEL.parseExpression(tokens, CLASS_PRECEDENCE, classExpressionStop), false), overrideModifier, nativeModifier, false, false, false));
      }
      else if (next.is(TokenType.Identifier) && tokens.nextIf(TokenType.Operator, '(')) {
        const methodName = next.value;
        if (staticModifier ? staticPropertyNames.has(methodName) : propertyNames.has(methodName))
          JEL.throwParseException(tokens.last(), `${staticModifier ? 'Static method' : 'Method'} ${methodName}() already declared`);
        (staticModifier ? staticPropertyNames : propertyNames).add(methodName);
        const args = JEL.checkTypedParameters(JEL.tryParseTypedParameters(tokens, CLASS_PRECEDENCE, NO_STOP), next);
        const varArgPos = args ? args!.findIndex(a=>a.varArgs) : -1;
        if (args == null)
          JEL.throwParseException(tokens.last(), `Can not parse argument list for method ${methodName}()`);
        else if (varArgPos >= 0 && args!.findIndex(a=>a.varArgs) < args!.length-1)
          JEL.throwParseException(tokens.last(), `Varargs are only supported for the last argument.`);
        const returnType = JEL.tryParseLambdaTypeCheck(tokens, (nativeModifier || abstractModifier) ? CLASS_EXPRESSION_STOP : LAMBDA);
        
        if (!abstractModifier && !nativeModifier)
          JEL.nextIsValueOrThrow(tokens, TokenType.Operator, '=>',  "Method expression must be preceded by '=>'.");
        else if (tokens.peekIs(TokenType.Operator, '=>'))
          throw new Error("Abstract or native methods must not use lambda operator ('=>')");

        const impl = nativeModifier ? new NativeFunction(peek, methodName, className.value, staticModifier, args!, returnType, varArgPos>=0) : 
                new Lambda(tokens.peek(), args!, returnType, abstractModifier ? TRUE_LITERAL : JEL.parseExpression(tokens, CLASS_PRECEDENCE, classExpressionStop), varArgPos>=0);
        methods.push(new MethodDef(peek, methodName, impl, overrideModifier, nativeModifier, staticModifier, abstractModifier, false));
      }
      else if (next.is(TokenType.Identifier)) {
        const propertyName = next.value;
        if (nativeModifier && !isNative && !staticModifier)
          JEL.throwParseException(next, `Property ${propertyName} is native in a non-native class. In a non-native class, only static native properties are allowed.`);
        if (staticModifier ? staticPropertyNames.has(propertyName) : propertyNames.has(propertyName))
          JEL.throwParseException(next, `${staticModifier ? 'Static property' : 'Property'} ${propertyName} is already declared`);
        (staticModifier ? staticPropertyNames : propertyNames).add(propertyName);
        
        let defaultValue = undefined, typeDef = undefined;
        if (tokens.nextIf(TokenType.Operator, '=')) 
          defaultValue = JEL.parseExpression(tokens, CLASS_PRECEDENCE, classExpressionStop);
        else if (tokens.nextIf(TokenType.Operator, ':')) {
          if (staticModifier && !nativeModifier)
            JEL.throwParseException(next, 'You must not set the type of a static property or declare a static property with type or without a value. Static properties require a value, but must not have an explicit type. Only native static can use a type.');
          typeDef = JEL.parseExpression(tokens, CLASS_PRECEDENCE, classTypeExpressionStop, true);
          defaultValue = tokens.nextIf(TokenType.Operator, '=') ? JEL.parseExpression(tokens, CLASS_PRECEDENCE, classExpressionStop) : undefined;
        }

        if (nativeModifier && defaultValue)
          JEL.throwParseException(next, 'A native property must not have a default value.');
        else if (abstractModifier && defaultValue)
          JEL.throwParseException(next, 'An abstract property must not have a default value.');
        else
          (staticModifier?staticProperties:properties).push(new PropertyDef(peek, propertyName, typeDef, defaultValue, nativeModifier, overrideModifier, abstractModifier));
      }
      else
        JEL.throwParseException(next, 'Unexpected token in class declaration. Expected an identifier to define a method or property.');
    }
  }
  
  static parseEnum(tokens: TokenReader, precedence: number, stopOps: any): EnumDef {
    const enumName = JEL.nextIsOrThrow(tokens, TokenType.Identifier, "Expected identifier after 'enum' declaration");
    tokens.nextIf(TokenType.Operator, ':');
    
    const values = [];
    while (true) {
      const peek = JEL.nextIsOrThrow(tokens, TokenType.Identifier, "Expected identifier in enum");
      values.push(peek.value);
      if (!tokens.nextIf(TokenType.Operator, ','))
        return new EnumDef(enumName, enumName.value, values);
    }
  }

  
  static parseCall(tokens: TokenReader, left: JelNode, methodName?: string, forgiving = false): JelNode {
    const argList: JelNode[] = [];
    const firstToken = tokens.last();

    if (tokens.nextIf(TokenType.Operator, ')')) 
        return methodName ? new MethodCall(firstToken, left, methodName, argList, undefined, forgiving) : new Call(firstToken, left, argList);
    
    while (!(tokens.peekIs(TokenType.Identifier) && tokens.peekIs(TokenType.Operator, '=', 1))) {
      argList.push(JEL.parseExpression(tokens, PARENS_PRECEDENCE, PARAMETER_STOP));
      
      const separator = JEL.expectOp(tokens, PARAMETER_STOP, "Expected ')' or ','");
      if (separator.value == ')')
        return methodName ? new MethodCall(firstToken, left, methodName, argList, undefined, forgiving) : new Call(firstToken,left, argList);
    }
 
    const argNames = new Set();           // for tracking dupes
    const namedArgs: Assignment[] = []; // for the actual values
    while (true) {
      const name = JEL.nextIsOrThrow(tokens, TokenType.Identifier, "Expected identifier for named argument");
      if (argNames.has(name.value))
        JEL.throwParseException(name, `Duplicate name ${name.value} in named arguments`);
      const equalToken = JEL.expectOp(tokens, EQUAL, "Expected equal sign after identifier for named argument");
      argNames.add(name.value);
      namedArgs.push(new Assignment(equalToken, name.value, JEL.parseExpression(tokens, PARENS_PRECEDENCE, PARAMETER_STOP)));

      const next = JEL.expectOp(tokens, PARAMETER_STOP, "Expected ')' or '='");
      if (next.value == ')')
        break;
    }
    return methodName ? new MethodCall(firstToken, left, methodName, argList, namedArgs, forgiving) : new Call(firstToken, left, argList, namedArgs);
  }
  
  static parseGet(tokens: TokenReader, left: JelNode): Get {
    const nameExp = JEL.parseExpression(tokens, PARENS_PRECEDENCE, SQUARE_BRACE_STOP);
    JEL.expectOp(tokens, SQUARE_BRACE_STOP, "Closing square bracket");
    return new Get(tokens.last(), left, nameExp);
  }
  
  static expectOp(tokens: TokenReader, allowedTypes: any, msg?: string): Token {
    const op = JEL.nextOrThrow(tokens, msg || "Expected operator, but expression ended");
    if (op.type != TokenType.Operator || !(op.value in allowedTypes))
      JEL.throwParseException(tokens.last(), msg || "Expected operator");
    return op;
  }
 
  static isOp(tokens: TokenReader, allowedTypes: any): boolean {
    if (!tokens.peekIs(TokenType.Operator))
      return false;
    return tokens.peek().value in allowedTypes;
  }

  static createPattern(value: string, jelToken?: Token): any {
		const t = jelToken || new Token(1, 1, '(anonymous)', TokenType.Pattern, value);
    return BaseTypeRegistry.get('Pattern').valueOf(PatternParser.parsePattern(Tokenizer.tokenizePattern(t.line, t.column, t.src, value), t)!, value);
  }
  
	

  static execute(txt: string, src: string, ctx: Context): Promise<any> {
    return new JEL(txt, src).execute(ctx);
  }

  static parseTree(txt: string, src: string): JelNode {
    return new JEL(txt, src).parseTree;
  }

}

