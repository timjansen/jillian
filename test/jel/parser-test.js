'use strict';

const assert = require('assert');
const JEL = require('../../src/jel/jel.js');

describe('jelParser', ()=>{
  describe('parseExpression()', ()=>{
    
    it('should parse a simple literal', ()=>{
      assert.deepEqual(new JEL('5').parseTree, {type: 'literal', value: 5});
      assert.deepEqual(new JEL('-5').parseTree, {type: 'literal', value: -5});
      assert.deepEqual(new JEL('"foo"').parseTree, {type: 'literal', value: 'foo'});
    });
    
    it('should parse variables', ()=>{
      assert.deepEqual(new JEL('a').parseTree, {type: 'variable', name: 'a'});
      assert.deepEqual(new JEL('a_b_c').parseTree, {type: 'variable', name: 'a_b_c'});
    });

    it('should parse some unary operations', ()=>{
      assert.deepEqual(new JEL('!a').parseTree, {type: 'operator', operator: '!', operand: {type: 'variable', name: 'a'}});
      assert.deepEqual(new JEL('abs -5').parseTree, {type: 'operator', operator: 'abs', operand: {type: 'literal', value: -5}});
    });

    
    it('should parse some binary operations', ()=>{
      assert.deepEqual(new JEL('a+b').parseTree, {type: 'operator', operator: '+', left: {type: 'variable', name: 'a'}, right: {type: 'variable', name: 'b'}});
      assert.deepEqual(new JEL('a+b+c').parseTree, {type: 'operator', operator: '+', left: {type: 'operator', operator: '+', left: {type: 'variable', name: 'a'}, right: {type: 'variable', name: 'b'}}, right: {type: 'variable', name: 'c'}});
    });

    it('should support precedence', ()=>{
      assert.deepEqual(new JEL('a+b*c').parseTree, {type: 'operator', operator: '+', left: {type: 'variable', name: 'a'}, right: {type: 'operator', operator: '*', left: {type: 'variable', name: 'b'}, right: {type: 'variable', name: 'c'}}});
    });

    it('should support parens', ()=>{
      assert.deepEqual(new JEL('(b+c)').parseTree, {type: 'operator', operator: '+', left: {type: 'variable', name: 'b'}, right: {type: 'variable', name: 'c'}});
      assert.deepEqual(new JEL('a+(b+c)').parseTree, {type: 'operator', operator: '+', left: {type: 'variable', name: 'a'}, right: {type: 'operator', operator: '+', left: {type: 'variable', name: 'b'}, right: {type: 'variable', name: 'c'}}});
      assert.deepEqual(new JEL('(a+b)+c+(((d*e)))').parseTree, new JEL('a+b+c+d*e').parseTree);
    });

    it('should support lambdas', ()=>{
      assert.deepEqual(new JEL('x=>1').parseTree, {type: 'lambda', args: ['x'], expression: {type: 'literal', value: 1}});
      assert.deepEqual(new JEL('()=>1').parseTree, {type: 'lambda', args: [], expression: {type: 'literal', value: 1}});
      assert.deepEqual(new JEL('(a, b)=>a+b').parseTree, {type: 'lambda', args: ['a', 'b'], expression: {type: 'operator', operator: '+', left: {type: 'variable', name: 'a'}, right: {type: 'variable', name: 'b'}}});
    });

    it('should support function calls', ()=>{
      assert.deepEqual(new JEL('f()').parseTree, {type: 'call', argList: [], left: {type: 'variable', name: 'f'}});
      assert.deepEqual(new JEL('f(2)').parseTree, {type: 'call', argList: [{type: 'literal', value: 2}], left: {type: 'variable', name: 'f'}});
      assert.deepEqual(new JEL('f("foo", 2)').parseTree, {type: 'call', argList: [{type: 'literal', value: 'foo'}, {type: 'literal', value: 2}], left: {type: 'variable', name: 'f'}});

      assert.deepEqual(new JEL('f(a: 5)').parseTree, {type: 'call', argList: [], argNames: {a: {type: 'literal', value: 5}}, left: {type: 'variable', name: 'f'}});
      assert.deepEqual(new JEL('f("foo", 4, a: 5, b: "bar")').parseTree, {type: 'call', argList: [], argNames: {a: {type: 'literal', value: 5}}, left: {type: 'variable', name: 'f'}});
    });
    
  });
});

