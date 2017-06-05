'use strict';

const assert = require('assert');
const JEL = require('../../src/jel/jel.js');
const jelAssert = require('./jel-assert.js');

const JelType = require('../../src/jel/type.js');
const JelNode = require('../../src/jel/node.js');
const Literal = require('../../src/jel/nodes/literal.js');
const Variable = require('../../src/jel/nodes/variable.js');
const Operator = require('../../src/jel/nodes/operator.js');
const List = require('../../src/jel/nodes/list.js');
const Reference = require('../../src/jel/nodes/reference.js');
const Condition = require('../../src/jel/nodes/condition.js');
const Assignment = require('../../src/jel/nodes/assignment.js');
const With = require('../../src/jel/nodes/with.js');
const Lambda = require('../../src/jel/nodes/lambda.js');
const Call = require('../../src/jel/nodes/call.js');

describe('JEL', function() {
  describe('parseTree', function() {
    
    it('should parse a simple literal', function() {
      jelAssert.equal(new JEL('5').parseTree, new Literal(5));
      jelAssert.equal(new JEL('+5').parseTree, new Literal(5));
      jelAssert.equal(new JEL('-5').parseTree, new Literal(-5));
      jelAssert.equal(new JEL('- 5').parseTree, new Literal(-5));
      jelAssert.equal(new JEL('"foo"').parseTree, new Literal('foo'));
      jelAssert.equal(new JEL('"foo"').parseTree, new Literal('foo'));
      jelAssert.equal(new JEL('`foo`').parseTree, new Literal('foo'));
    });
    
    it('should parse variables', function() {
      jelAssert.equal(new JEL('a').parseTree, new Variable('a'));
      jelAssert.equal(new JEL('a_b_c').parseTree, new Variable('a_b_c'));
    });

    it('should parse some unary operations', function() {
      jelAssert.equal(new JEL('!a').parseTree, new Operator('!', new Variable('a')));
      jelAssert.equal(new JEL('!-5').parseTree, new Operator('!', new Literal(-5)));
    });
    
    it('should parse some binary operations', function() {
      jelAssert.equal(new JEL('5+5').parseTree, new Operator('+', new Literal(5), new Literal(5)));
      jelAssert.equal(new JEL('a+b').parseTree, new Operator('+', new Variable('a'), new Variable('b')));
      jelAssert.equal(new JEL('a+b+c').parseTree, new Operator('+', new Operator('+', new Variable('a'), new Variable('b')), new Variable('c')));
    });

    it('should support precedence', function() {
      jelAssert.equal(new JEL('a+b*c').parseTree, new Operator('+', new Variable('a'), new Operator('*', new Variable('b'), new Variable('c'))));
    });
 
    it('should support parens', function() {
      jelAssert.equal(new JEL('(b+c)').parseTree, new Operator('+', new Variable('b'), new Variable('c')));
      jelAssert.equal(new JEL('(((((b+c)))))').parseTree, new Operator('+', new Variable('b'), new Variable('c')));
      jelAssert.equal(new JEL('a+(b+c)').parseTree, new Operator('+', new Variable('a'), new Operator('+', new Variable('b'), new Variable('c'))));
      jelAssert.equal(new JEL('(a+b)+c+(((d*e)))').parseTree, new JEL('a+b+c+d*e').parseTree);
    });

    it('should support function calls', function() {
      jelAssert.equal(new JEL('f()').parseTree, new Call(new Variable('f'), []));
      jelAssert.equal(new JEL('f(2)').parseTree, new Call(new Variable('f'), [new Literal(2)]));
      jelAssert.equal(new JEL('f("foo", 2)').parseTree, new Call(new Variable('f'), [new Literal('foo'), new Literal(2)]));

      jelAssert.equal(new JEL('f(a=5)').parseTree, new Call(new Variable('f'), [], [new Assignment('a', new Literal(5))]));
      jelAssert.equal(new JEL('f("foo", 4, a = 5, b = "bar")').parseTree, new Call(new Variable('f'), [new Literal('foo'), new Literal(4)], [new Assignment('a', new Literal(5)), new Assignment('b', new Literal('bar'))]));

      jelAssert.equal(new JEL('(f)()').parseTree, new Call(new Variable('f'), []));
      jelAssert.equal(new JEL('g(a=>2)').parseTree, new Call(new Variable('g'), [new Lambda(['a'], new Literal(2))]));
      jelAssert.equal(new JEL('g((a,b,c)=>2)').parseTree, new Call(new Variable('g'), [new Lambda(['a', 'b', 'c'], new Literal(2))]));
    });
  
    it('should support lambdas', function() {
      jelAssert.equal(new JEL('x=>1').parseTree, new Lambda(['x'], new Literal(1)));
      jelAssert.equal(new JEL('()=>1').parseTree, new Lambda([], new Literal(1)));
      jelAssert.equal(new JEL('(a, b)=>a+b').parseTree, new Lambda(['a', 'b'], new Operator('+', new Variable('a'), new Variable('b'))));
      jelAssert.equal(new JEL('(a=>a)(1)').parseTree, new Call(new Lambda(['a'], new Variable('a')), [new Literal(1)]));
      jelAssert.equal(new JEL('(a=>a*a)(1)').parseTree, new Call(new Lambda(['a'], new Operator('*', new Variable('a'), new Variable('a'))), [new Literal(1)]));
      jelAssert.equal(new JEL('((a, b)=>a+b)(1,2)').parseTree, new Call(new Lambda(['a', 'b'], new Operator('+', new Variable('a'), new Variable('b'))), [new Literal(1),  new Literal(2)]));
    });

    it('should support if/then/else', function() {
      jelAssert.equal(new JEL('if a then b else c').parseTree, new Condition(new Variable('a'), new Variable('b'), new Variable('c')));
      jelAssert.equal(new JEL('if (a!=0) then ((b)) else f()').parseTree, new Condition(new Operator('!=', new Variable('a'), new Literal(0)), new Variable('b'), new Call(new Variable('f'), [])));
      assert.throws(()=>new JEL('if a else b'));
      jelAssert.equal(new JEL("if false then (if false then 2 else 1) else 6").parseTree, new Condition(new Literal(false), new Condition(new Literal(false), new Literal(2), new Literal(1)), new Literal(6)));
    });  
    
    it('should support with', function() {
      jelAssert.equal(new JEL('with a=1: a').parseTree, new With([new Assignment('a', new Literal(1))], new Variable('a')));
      jelAssert.equal(new JEL('with a=1,b=2:b').parseTree, new With([new Assignment('a', new Literal(1)), new Assignment('b', new Literal(2))], new Variable('b')));
      jelAssert.equal(new JEL('with a=1, b=a + 2: b').parseTree, new With([new Assignment('a', new Literal(1)), new Assignment('b', new Operator('+', new Variable('a'), new Literal(2)))], new Variable('b')));
      jelAssert.equal(new JEL('with a=1 : a=>2').parseTree, new With([new Assignment('a', new Literal(1))], new Lambda(['a'], new Literal(2))));
      jelAssert.equal(new JEL('with a=1, b=c=>d : b').parseTree, new With([new Assignment('a', new Literal(1)), new Assignment('b', new Lambda(['c'], new Variable('d')))], new Variable('b')));
    });

    it('allows only lower-case variables', function() {
      assert.throws(()=>new JEL('with A= 1 => a').parseTree);
      assert.throws(()=>new JEL('with _=2 => 2').parseTree);
    });

    it('should support lists', function() {
      jelAssert.equal(new JEL('[]').parseTree, new List([]));
      jelAssert.equal(new JEL('[a]').parseTree, new List([new Variable('a')]));
      jelAssert.equal(new JEL('[a+2,a]').parseTree, new List([new Operator('+', new Variable('a'), new Literal(2)), new Variable('a')]));
    });

  });
});

