'use strict';

const assert = require('assert');
const jt = require('../../src/jel/tokenizer.js');

describe('jelTokenizer', ()=>{
  describe('tokenize()', ()=>{
    
    it('should parse an empty string', ()=>{
      assert.deepEqual(jt.tokenize(''), []);
      assert.deepEqual(jt.tokenize('   '), []);
    });

     it('should parse operators', ()=>{
      assert.deepEqual(jt.tokenize('<=+'), [{value: '<=', operator: true}, {value: '+', operator: true}]);
    });

    it('should parse identifiers', ()=>{
      assert.deepEqual(jt.tokenize('a $_b0 c_d_093_d'), [{value: 'a', identifier: true}, {value: '$_b0', identifier: true}, {value: 'c_d_093_d', identifier: true}]);
    });

    it('should parse literals', ()=>{
      assert.deepEqual(jt.tokenize('3.5 null true "hello" `hi`'), [{value: 3.5, literal: true}, {value: null, literal: true}, {value: true, literal: true},
                                                                         {value: 'hello', literal: true}, {value: 'hi', literal: true}]);
    });
});
});

