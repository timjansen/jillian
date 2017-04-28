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

  });
});

