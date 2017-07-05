'use strict';

const assert = require('assert');
const jt = require('../../src/jel/tokenizer.js');

describe('jelTokenizer', function() {
  describe('tokenize()', function() {
    
    it('should parse an empty string', function() {
      assert.deepEqual(jt.tokenize('').tokens, []);
      assert.deepEqual(jt.tokenize('   ').tokens, []);
    });

     it('should parse operators', function() {
      assert.deepEqual(jt.tokenize('<=+').tokens, [{value: '<=', operator: true}, {value: '+', operator: true}]);
      assert.deepEqual(jt.tokenize('!a').tokens, [{value: '!', operator: true}, {value: 'a', identifier: true}]);
      assert.deepEqual(jt.tokenize('(a)').tokens, [{value: '(', operator: true}, {value: 'a', identifier: true}, {value: ')', operator: true}]);
    });

    it('should parse identifiers', function() {
      assert.deepEqual(jt.tokenize('a $_b0 c_d_093_d').tokens, [{value: 'a', identifier: true}, {value: '$_b0', identifier: true}, {value: 'c_d_093_d', identifier: true}]);
    });

    
    it('should parse comments', function() {
      assert.deepEqual(jt.tokenize('a //comment\n $_b0 /*blabla*/ "d" f/*bla\nbla*/a').tokens, [{value: 'a', identifier: true}, {value: '$_b0', identifier: true}, {value: 'd', literal: true},
                                                                                               {value: 'f', identifier: true}, {value: 'a', identifier: true}]);
    });
    
    it('should parse literals', function() {
      assert.deepEqual(jt.tokenize('3.5 null true "hello" "hi\\n\\"di\\"\\tho" \'huhu\'').tokens, [{value: 3.5, literal: true}, {value: null, literal: true}, {value: true, literal: true},
                                                                         {value: 'hello', literal: true}, {value: 'hi\n"di"\tho', literal: true}, {value: 'huhu', literal: true}]);
    });

    it('should parse patterns', function() {
      assert.deepEqual(jt.tokenize('`test` `te\\nst`').tokens, [{value: 'test', pattern: true}, {value: 'te\\nst', pattern: true}]);
    });
    
    it('should parse expressions', function() {
      assert.deepEqual(jt.tokenize('a+1').tokens, [{value: 'a', identifier: true}, {value: '+', operator: true}, {value: 1, literal: true}]);
      assert.deepEqual(jt.tokenize('a-1').tokens, [{value: 'a', identifier: true}, {value: '-', operator: true}, {value: 1, literal: true}]);
      assert.deepEqual(jt.tokenize('a + 1').tokens, [{value: 'a', identifier: true}, {value: '+', operator: true}, {value: 1, literal: true}]);
      assert.deepEqual(jt.tokenize('a  -  1').tokens, [{value: 'a', identifier: true}, {value: '-', operator: true}, {value: 1, literal: true}]);
    });

    
    it('should provide peek(), last() and next()', function() {
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
    
    it('should provide copy()', function() {
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

