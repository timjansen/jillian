'use strict';

const assert = require('assert');
const jt = require('../../src/jel/tokenizer.js');

describe('jelTokenizer', ()=>{
  describe('tokenize()', ()=>{
    
    it('should parse an empty string', ()=>{
      assert.deepEqual(jt.tokenize('').tokens, []);
      assert.deepEqual(jt.tokenize('   ').tokens, []);
    });

     it('should parse operators', ()=>{
      assert.deepEqual(jt.tokenize('<=+').tokens, [{value: '<=', operator: true}, {value: '+', operator: true}]);
      assert.deepEqual(jt.tokenize('!a').tokens, [{value: '!', operator: true}, {value: 'a', identifier: true}]);
      assert.deepEqual(jt.tokenize('(a)').tokens, [{value: '(', operator: true}, {value: 'a', identifier: true}, {value: ')', operator: true}]);
    });

    it('should parse identifiers', ()=>{
      assert.deepEqual(jt.tokenize('a $_b0 c_d_093_d').tokens, [{value: 'a', identifier: true}, {value: '$_b0', identifier: true}, {value: 'c_d_093_d', identifier: true}]);
    });

    it('should parse literals', ()=>{
      assert.deepEqual(jt.tokenize('3.5 null true "hello" `hi`').tokens, [{value: 3.5, type: 'literal'}, {value: null, type: 'literal'}, {value: true, type: 'literal'},
                                                                         {value: 'hello', type: 'literal'}, {value: 'hi', type: 'literal'}]);
    });

    it('should parse expressions', ()=>{
      assert.deepEqual(jt.tokenize('a+1').tokens, [{value: 'a', identifier: true}, {value: '+', operator: true}, {value: 1, type: 'literal'}]);
      assert.deepEqual(jt.tokenize('a-1').tokens, [{value: 'a', identifier: true}, {value: '-', operator: true}, {value: 1, type: 'literal'}]);
      assert.deepEqual(jt.tokenize('a + 1').tokens, [{value: 'a', identifier: true}, {value: '+', operator: true}, {value: 1, type: 'literal'}]);
      assert.deepEqual(jt.tokenize('a  -  1').tokens, [{value: 'a', identifier: true}, {value: '-', operator: true}, {value: 1, type: 'literal'}]);
    });

    
    it('should provide peek(), last() and next()', ()=>{
      const t = jt.tokenize('1 2 3 4 5');
      assert.equal(t.peek().value, 1);
      assert.equal(t.peek().value, 1);
      assert.equal(t.last(), null);
      assert.equal(t.next().value, 1);
      assert.equal(t.last().value, 1);
      assert.equal(t.next().value, 2);
      assert.equal(t.last().value, 2);
      assert.equal(t.peek().value, 3);
      assert.equal(t.next().value, 3);
      assert.equal(t.next().value, 4);
      assert.equal(t.last().value, 4);
      assert.equal(t.next().value, 5);
      assert.equal(t.peek(), undefined);
      assert.equal(t.next(), undefined);
    });
    
    it('should provide copy()', ()=>{
      const t = jt.tokenize('1 2 3 4 5');
      assert.equal(t.next().value, 1);
      const t2 = t.copy();
      assert(t2.next && t2.last && t2.peek && t2.copy);
      assert.equal(t2.next().value, 2);
      assert.equal(t2.next().value, 3);
      assert.equal(t.next().value, 2);
      assert.equal(t.next().value, 3);
      assert.equal(t.next().value, 4);
      assert.equal(t2.next().value, 4);
      assert.equal(t.next().value, 5);
      assert.equal(t.next(), undefined);
      assert.equal(t2.next().value, 5);
      assert.equal(t2.next(), undefined);
    });

    
  });
});

