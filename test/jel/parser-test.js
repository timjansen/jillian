'use strict';

require('source-map-support').install();
const assert = require('assert');

const DefaultContext = require('../../build/jel/DefaultContext.js').default;
const JEL = require('../../build/jel/JEL.js').default;

const {Token, TokenType, RegExpToken, TemplateToken, FractionToken} = require('../../build/jel/Token.js');
const Program = require('../../build/jel/expressionNodes/Program.js').default;
const Literal = require('../../build/jel/expressionNodes/Literal.js').default;
const Variable = require('../../build/jel/expressionNodes/Variable.js').default;
const Operator = require('../../build/jel/expressionNodes/Operator.js').default;
const List = require('../../build/jel/expressionNodes/List.js').default;
const Reference = require('../../build/jel/expressionNodes/Reference.js').default;
const Condition = require('../../build/jel/expressionNodes/Condition.js').default;
const Assignment = require('../../build/jel/expressionNodes/Assignment.js').default;
const Let = require('../../build/jel/expressionNodes/Let.js').default;
const Lambda = require('../../build/jel/expressionNodes/Lambda.js').default;
const TypedParameterDefinition = require('../../build/jel/expressionNodes/TypedParameterDefinition.js').default;
const Call = require('../../build/jel/expressionNodes/Call.js').default;
const MethodCall = require('../../build/jel/expressionNodes/MethodCall.js').default;
const Optional = require('../../build/jel/expressionNodes/Optional.js').default;

const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert();

const D = new Token(0, 0, '(you should never see this dummy token)', TokenType.Literal, null);

describe('JEL', function() {
  let defaultContext, ctx;
  before(function(){
    return DefaultContext.get().then(dc=> {
      defaultContext = dc;
      ctx = defaultContext;
      jelAssert.setCtx(ctx);
    });
  });
  
  describe('parseTree', function() {
    
    it('should parse a simple literal', function() {
      jelAssert.equal(new JEL('5').parseTree, new Literal(D, 5));
      jelAssert.equal(new JEL('+5').parseTree, new Literal(D, 5));
      jelAssert.equal(new JEL('-5').parseTree, new Literal(D, -5));
      jelAssert.equal(new JEL('- 5').parseTree, new Literal(D, -5));
      jelAssert.equal(new JEL('"foo"').parseTree, new Literal(D, 'foo'));
      jelAssert.equal(new JEL('"foo"').parseTree, new Literal(D, 'foo'));
      jelAssert.equal(new JEL('"f\\no\\no"').parseTree, new Literal(D, 'f\no\no'));
    });
    
    it('should parse variables', function() {
      jelAssert.equal(new JEL('a').parseTree, new Variable(D, 'a'));
      jelAssert.equal(new JEL('a_b_c').parseTree, new Variable(D, 'a_b_c'));
    });

    it('should parse some unary operations', function() {
      jelAssert.equal(new JEL('!a').parseTree, new Operator(D, '!', new Variable(D, 'a')));
      jelAssert.equal(new JEL('!-5').parseTree, new Operator(D, '!', new Literal(D, -5)));
    });
    
    it('should parse some binary operations', function() {
      jelAssert.equal(new JEL('5+5').parseTree, new Operator(D, '+', new Literal(D, 5), new Literal(D, 5)));
      jelAssert.equal(new JEL('a+b').parseTree, new Operator(D, '+', new Variable(D, 'a'), new Variable(D, 'b')));
      jelAssert.equal(new JEL('a+b+c').parseTree, new Operator(D, '+', new Operator(D, '+', new Variable(D, 'a'), new Variable(D, 'b')), new Variable(D, 'c')));
    });

    it('should support precedence', function() {
      jelAssert.equal(new JEL('a+b*c').parseTree, new Operator(D, '+', new Variable(D, 'a'), new Operator(D, '*', new Variable(D, 'b'), new Variable(D, 'c'))));
    });
 
    it('should support parens', function() {
      jelAssert.equal(new JEL('(b+c)').parseTree, new Operator(D, '+', new Variable(D, 'b'), new Variable(D, 'c')));
      jelAssert.equal(new JEL('(((((b+c)))))').parseTree, new Operator(D, '+', new Variable(D, 'b'), new Variable(D, 'c')));
      jelAssert.equal(new JEL('a+(b+c)').parseTree, new Operator(D, '+', new Variable(D, 'a'), new Operator(D, '+', new Variable(D, 'b'), new Variable(D, 'c'))));
      jelAssert.equal(new JEL('(a+b)+c+(((d*e)))').parseTree, new JEL('a+b+c+d*e').parseTree);
    });

    it('should support function calls', function() {
      jelAssert.equal(new JEL('f()').parseTree, new Call(D, new Variable(D, 'f'), []));
      jelAssert.equal(new JEL('f(2)').parseTree, new Call(D, new Variable(D, 'f'), [new Literal(D, 2)]));
      jelAssert.equal(new JEL('f("foo", 2)').parseTree, new Call(D, new Variable(D, 'f'), [new Literal(D, 'foo'), new Literal(D, 2)]));

      jelAssert.equal(new JEL('f(a=5)').parseTree, new Call(D, new Variable(D, 'f'), [], [new Assignment(D, 'a', new Literal(D, 5))]));
      jelAssert.equal(new JEL('f("foo", 4, a = 5, b = "bar")').parseTree, new Call(D, new Variable(D, 'f'), [new Literal(D, 'foo'), new Literal(D, 4)], [new Assignment(D, 'a', new Literal(D, 5)), new Assignment(D, 'b', new Literal(D, 'bar'))]));

      jelAssert.equal(new JEL('(f)()').parseTree, new Call(D, new Variable(D, 'f'), []));
      jelAssert.equal(new JEL('g(a=>2)').parseTree, new Call(D, new Variable(D, 'g'), [new Lambda(D, [new TypedParameterDefinition(D, 'a')], undefined, new Literal(D, 2))]));
      jelAssert.equal(new JEL('g((a,b,c)=>2)').parseTree, new Call(D, new Variable(D, 'g'), [new Lambda(D, [new TypedParameterDefinition(D, 'a'), new TypedParameterDefinition(D, 'b'), new TypedParameterDefinition(D, 'c')], undefined, new Literal(D, 2))]));
    });

    it('should support method calls', function() {
      jelAssert.equal(new JEL('a.f()').parseTree, new MethodCall(D, new Variable(D, 'a'), 'f', []));
      jelAssert.equal(new JEL('a.f(2)').parseTree, new MethodCall(D, new Variable(D, 'a'), 'f', [new Literal(D, 2)]));
      jelAssert.equal(new JEL('a.f("foo", 2)').parseTree, new MethodCall(D, new Variable(D, 'a'), 'f', [new Literal(D, 'foo'), new Literal(D, 2)]));

      jelAssert.equal(new JEL('a.f(a=5)').parseTree, new MethodCall(D, new Variable(D, 'a'), 'f', [], [new Assignment(D, 'a', new Literal(D, 5))]));
      jelAssert.equal(new JEL('a.f("foo", 4, a = 5, b = "bar")').parseTree, new MethodCall(D, new Variable(D, 'a'), 'f', [new Literal(D, 'foo'), new Literal(D, 4)], [new Assignment(D, 'a', new Literal(D, 5)), new Assignment(D, 'b', new Literal(D, 'bar'))]));
    });

    
    it('should support lambdas', function() {
      jelAssert.equal(new JEL('x=>1').parseTree, new Lambda(D, [new TypedParameterDefinition(D, 'x')], undefined, new Literal(D, 1)));
      jelAssert.equal(new JEL('()=>1').parseTree, new Lambda(D, [], undefined, new Literal(D, 1)));
      jelAssert.equal(new JEL('(a, b)=>a+b').parseTree, new Lambda(D, [new TypedParameterDefinition(D, 'a'), new TypedParameterDefinition(D, 'b')], undefined, new Operator(D, '+', new Variable(D, 'a'), new Variable(D, 'b'))));
      jelAssert.equal(new JEL('(a=>a)(1)').parseTree, new Call(D, new Lambda(D, [new TypedParameterDefinition(D, 'a')], undefined, new Variable(D, 'a')), [new Literal(D, 1)]));
      jelAssert.equal(new JEL('(a=>a*a)(1)').parseTree, new Call(D, new Lambda(D, [new TypedParameterDefinition(D, 'a')], undefined, new Operator(D, '*', new Variable(D, 'a'), new Variable(D, 'a'))), [new Literal(D, 1)]));
      jelAssert.equal(new JEL('((a, b)=>a+b)(1,2)').parseTree, new Call(D, new Lambda(D, [new TypedParameterDefinition(D, 'a'), new TypedParameterDefinition(D, 'b')], undefined, new Operator(D, '+', new Variable(D, 'a'), new Variable(D, 'b'))), [new Literal(D, 1),  new Literal(D, 2)]));
      jelAssert.equal(new JEL('(a="x")=>a').parseTree, new Lambda(D, [new TypedParameterDefinition(D, 'a', new Literal(D, 'x'))], undefined, new Variable(D, 'a')));
      jelAssert.equal(new JEL('(a: LocalDate)=>a').parseTree, new Lambda(D, [new TypedParameterDefinition(D, 'a', undefined, new Variable(D, 'LocalDate'))], undefined, new Variable(D, 'a')));
      jelAssert.equal(new JEL('(a: String = "y"): String=>a').parseTree, new Lambda(D, [new TypedParameterDefinition(D, 'a', new Literal(D, 'y'), new Variable(D, 'String'))], new TypedParameterDefinition(D, 'return value', undefined, new Variable(D, 'String')), new Variable(D, 'a')));
      jelAssert.equal(new JEL('((a = 12, b: String, c: Float = 1): String=>a+b)(1,2)').parseTree, new Call(D, new Lambda(D, [new TypedParameterDefinition(D, 'a', new Literal(D, 12)), 
                                                                                                                new TypedParameterDefinition(D, 'b', null, new Variable(D, 'String')), 
                                                                                                                new TypedParameterDefinition(D, 'c', new Literal(D, 1), new Variable(D, 'Float'))], new TypedParameterDefinition(D, 'return value', undefined, new Variable(D, 'String')), 
                                                                                                               new Operator(D, '+', new Variable(D, 'a'), new Variable(D, 'b'))), [new Literal(D, 1),  new Literal(D, 2)]));
    });

    it('should support if/then/else', function() {
      jelAssert.equal(new JEL('if a then b else c').parseTree, new Condition(D, new Variable(D, 'a'), new Variable(D, 'b'), new Variable(D, 'c')));
      jelAssert.equal(new JEL('if (a!=0) then ((b)) else f()').parseTree, new Condition(D, new Operator(D, '!=', new Variable(D, 'a'), new Literal(D, 0)), new Variable(D, 'b'), new Call(D, new Variable(D, 'f'), [])));
      assert.throws(()=>new JEL('if a else b'));
      jelAssert.equal(new JEL("if false then (if false then 2 else 1) else 6").parseTree, new Condition(D, new Literal(D, false), new Condition(D, new Literal(D, false), new Literal(D, 2), new Literal(D, 1)), new Literal(D, 6)));
    });  
    
    it('allows only lower-case variables', function() {
      assert.throws(()=>new JEL('do let A= 1 => a').parseTree);
      assert.throws(()=>new JEL('do let _=2 => 2').parseTree);
    });

    it('should support lists', function() {
      jelAssert.equal(new JEL('[]').parseTree, new List(D, []));
      jelAssert.equal(new JEL('[a]').parseTree, new List(D, [new Variable(D, 'a')]));
      jelAssert.equal(new JEL('[a+2,a]').parseTree, new List(D, [new Operator(D, '+', new Variable(D, 'a'), new Literal(D, 2)), new Variable(D, 'a')]));
    });

    it('should support optionals', function() {
      jelAssert.equal(new JEL('LocalDate?').parseTree, new Optional(D, new Variable(D, 'LocalDate')));
      jelAssert.equal(new JEL('@LocalDate?').parseTree, new Optional(D, new Reference(D, 'LocalDate')));
      jelAssert.equal(new JEL('(LocalDate)?').parseTree, new Optional(D, new Variable(D, 'LocalDate')));
    });

  });
});

