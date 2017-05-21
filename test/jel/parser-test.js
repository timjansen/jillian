'use strict';

const assert = require('assert');
const JEL = require('../../src/jel/jel.js');

describe('jelParser', function() {
  describe('parseExpression()', function() {
    
    it('should parse a simple literal', function() {
      assert.deepEqual(new JEL('5').parseTree, {type: 'literal', value: 5});
      assert.deepEqual(new JEL('+5').parseTree, {type: 'literal', value: 5});
      assert.deepEqual(new JEL('-5').parseTree, {type: 'literal', value: -5});
      assert.deepEqual(new JEL('- 5').parseTree, {type: 'literal', value: -5});
      assert.deepEqual(new JEL('"foo"').parseTree, {type: 'literal', value: 'foo'});
    });
    
    it('should parse variables', function() {
      assert.deepEqual(new JEL('a').parseTree, {type: 'variable', name: 'a'});
      assert.deepEqual(new JEL('a_b_c').parseTree, {type: 'variable', name: 'a_b_c'});
    });

    it('should parse some unary operations', function() {
      assert.deepEqual(new JEL('!a').parseTree, {type: 'operator', operator: '!', operand: {type: 'variable', name: 'a'}});
      assert.deepEqual(new JEL('!-5').parseTree, {type: 'operator', operator: '!', operand: {type: 'literal', value: -5}});
    });
    
    it('should parse some binary operations', function() {
      assert.deepEqual(new JEL('a+b').parseTree, {type: 'operator', operator: '+', left: {type: 'variable', name: 'a'}, right: {type: 'variable', name: 'b'}});
      assert.deepEqual(new JEL('a+b+c').parseTree, {type: 'operator', operator: '+', left: {type: 'operator', operator: '+', left: {type: 'variable', name: 'a'}, right: {type: 'variable', name: 'b'}}, right: {type: 'variable', name: 'c'}});
    });

    it('should support precedence', function() {
      assert.deepEqual(new JEL('a+b*c').parseTree, {type: 'operator', operator: '+', left: {type: 'variable', name: 'a'}, right: {type: 'operator', operator: '*', left: {type: 'variable', name: 'b'}, right: {type: 'variable', name: 'c'}}});
    });
 
    it('should support parens', function() {
      assert.deepEqual(new JEL('(b+c)').parseTree, {type: 'operator', operator: '+', left: {type: 'variable', name: 'b'}, right: {type: 'variable', name: 'c'}});
      assert.deepEqual(new JEL('(((((b+c)))))').parseTree, {type: 'operator', operator: '+', left: {type: 'variable', name: 'b'}, right: {type: 'variable', name: 'c'}});
      assert.deepEqual(new JEL('a+(b+c)').parseTree, {type: 'operator', operator: '+', left: {type: 'variable', name: 'a'}, right: {type: 'operator', operator: '+', left: {type: 'variable', name: 'b'}, right: {type: 'variable', name: 'c'}}});
      assert.deepEqual(new JEL('(a+b)+c+(((d*e)))').parseTree, new JEL('a+b+c+d*e').parseTree);
    });

    it('should support function calls', function() {
      assert.deepEqual(new JEL('f()').parseTree, {type: 'call', argList: [], left: {type: 'variable', name: 'f'}});
      assert.deepEqual(new JEL('f(2)').parseTree, {type: 'call', argList: [{type: 'literal', value: 2}], left: {type: 'variable', name: 'f'}});
      assert.deepEqual(new JEL('f("foo", 2)').parseTree, {type: 'call', argList: [{type: 'literal', value: 'foo'}, {type: 'literal', value: 2}], left: {type: 'variable', name: 'f'}});

      assert.deepEqual(new JEL('f(a: 5)').parseTree, {type: 'call', argList: [], argNames: {a: {type: 'literal', value: 5}}, left: {type: 'variable', name: 'f'}});
      assert.deepEqual(new JEL('f("foo", 4, a: 5, b: "bar")').parseTree, {type: 'call', argList: [{type: 'literal', value: 'foo'}, {type: 'literal', value: 4}], argNames: {a: {type: 'literal', value: 5}, b: {type: 'literal', value: 'bar'}}, left: {type: 'variable', name: 'f'}});

      assert.deepEqual(new JEL('(f)()').parseTree, {type: 'call', argList: [], left: {type: 'variable', name: 'f'}});
      assert.deepEqual(new JEL('g(a=>2)').parseTree, {type: 'call', argList: [{type: 'lambda', args: ['a'], expression:  {type: 'literal', value: 2}}], left: {type: 'variable', name: 'g'}});
      assert.deepEqual(new JEL('g((a,b,c)=>2)').parseTree, {type: 'call', argList: [{type: 'lambda', args: ['a', 'b', 'c'], expression: {type: 'literal', value: 2}}], left: {type: 'variable', name: 'g'}});
    });
  
    it('should support lambdas', function() {
      assert.deepEqual(new JEL('x=>1').parseTree, {type: 'lambda', args: ['x'], expression: {type: 'literal', value: 1}});
      assert.deepEqual(new JEL('()=>1').parseTree, {type: 'lambda', args: [], expression: {type: 'literal', value: 1}});
      assert.deepEqual(new JEL('(a, b)=>a+b').parseTree, {type: 'lambda', args: ['a', 'b'], expression: {type: 'operator', operator: '+', left: {type: 'variable', name: 'a'}, right: {type: 'variable', name: 'b'}}});
      assert.deepEqual(new JEL('(a=>a)(1)').parseTree, {type: 'call', argList: [{type: 'literal', value: 1}], left: {type: 'lambda', args: ['a'], expression: {type: 'variable', name: 'a'}}});
      assert.deepEqual(new JEL('(a=>a*a)(1)').parseTree, {type: 'call', argList: [{type: 'literal', value: 1}], left: {type: 'lambda', args: ['a'], expression: {type: 'operator', operator: '*', left: {type: 'variable', name: 'a'}, right: {type: 'variable', name: 'a'}}}});
      assert.deepEqual(new JEL('((a, b)=>a+b)(1,2)').parseTree, {type: 'call', argList: [{type: 'literal', value: 1},  {type: 'literal', value: 2}], left: {type: 'lambda', args: ['a', 'b'], expression: {type: 'operator', operator: '+', left: {type: 'variable', name: 'a'}, right: {type: 'variable', name: 'b'}}}});
    });

    it('should support if/then/else', function() {
      assert.deepEqual(new JEL('if a then b else c').parseTree, {type: 'condition', condition: {type: 'variable', name: 'a'}, then: {type: 'variable', name: 'b'}, else: {type: 'variable', name: 'c'}});
      assert.deepEqual(new JEL('if (a!=0) then ((b)) else f()').parseTree, {type: 'condition', condition: {type: 'operator', operator: '!=', left: {type: 'variable', name: 'a'}, right: {type: 'literal', value: 0}}, then: {type: 'variable', name: 'b'}, else: {type: 'call', argList: [], left: {type: 'variable', name: 'f'}}});
      assert.throws(()=>new JEL('if a else b'));
    });  
    
    it('should support with', function() {
      assert.deepEqual(new JEL('with a: 1 => a').parseTree, {type: 'with', assignments: [{name: 'a', expression: {type: 'literal', value: 1}}], expression: {type: 'variable', name: 'a'}});
      assert.deepEqual(new JEL('with a:1,b:2=>b').parseTree, {type: 'with', assignments: [{name: 'a', expression: {type: 'literal', value: 1}}, {name: 'b', expression: {type: 'literal', value: 2}}], expression: {type: 'variable', name: 'b'}});
      assert.deepEqual(new JEL('with a:1, b: a + 2 => b').parseTree, {type: 'with', assignments: [{name: 'a', expression: {type: 'literal', value: 1}}, {name: 'b', expression: {type: 'operator', operator: '+', left: {type: 'variable', name: 'a'}, right: {type: 'literal', value: 2}}}], expression: {type: 'variable', name: 'b'}});
      assert.deepEqual(new JEL('with a: 1 => a=>2').parseTree, {type: 'with', assignments: [{name: 'a', expression: {type: 'literal', value: 1}}], expression: {type: 'lambda', args: ['a'], expression: {type: 'literal', value: 2}}});
      assert.deepEqual(new JEL('with a:1, b: (c => d) => b').parseTree, {type: 'with', assignments: [{name: 'a', expression: {type: 'literal', value: 1}}, {name: 'b', expression: {type: 'lambda', args: ['c'], expression: {type: 'variable', name: 'd'}}}], expression: {type: 'variable', name: 'b'}});
    });

    it('allows only lower-case variables', function() {
      assert.throws(()=>new JEL('with A: 1 => a').parseTree);
      assert.throws(()=>new JEL('with _:2 => 2').parseTree);
    });

    it('should support lists', function() {
      assert.deepEqual(new JEL('[]').parseTree, {type: 'list', elements: []});
      assert.deepEqual(new JEL('[a]').parseTree, {type: 'list', elements: [{type: 'variable', name: 'a'}]});
      assert.deepEqual(new JEL('[a+2,a]').parseTree, {type: 'list', elements: [{type: 'operator', operator: '+', left: {type: 'variable', name: 'a'}, right: {type: 'literal', value: 2}}, {type: 'variable', name: 'a'}]});
    });

  });
});

