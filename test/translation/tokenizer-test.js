'use strict';

const assert = require('assert');
const Tokenizer = require('../../src/translation/tokenizer.js');

describe('patternTokenizer', function() {
  describe('tokenize()', function() {
    
    it('should parse an empty string', function() {
      assert.deepEqual(Tokenizer.tokenize('').tokens, []);
      assert.deepEqual(Tokenizer.tokenize('   ').tokens, []);
    });

    it('should parse words and ops', function() {
      assert.deepEqual(Tokenizer.tokenize('foo bar bar').tokens, [{word: 'foo'}, {word: 'bar'}, {word: 'bar'}]);
      assert.deepEqual(Tokenizer.tokenize('   foo\n bar\nbar   \t  ').tokens, [{word: 'foo'}, {word: 'bar'}, {word: 'bar'}]);
      assert.deepEqual(Tokenizer.tokenize('foo [bar|n42] [bar]?').tokens, [{word: 'foo'}, {op: '['}, {word: 'bar'}, {op: '|'}, {word: 'n42'}, 
                                                                           {op:']'}, {op: '['}, {word: 'bar'}, {op: ']?'}]);
    });

    it('should parse templates', function() {
      const u = undefined;
      assert.deepEqual(Tokenizer.tokenize('{{trr}} {{nl: g}} {{foo:bar.x}} {{bar.foo.kk::bla {} bla}}').tokens, [
        {name: u, template: 'trr', hints: [], expression: undefined}, 
        {name: 'nl', template: 'g', hints: [], expression: undefined}, 
        {name: 'foo', template: 'bar', hints: ['x'], expression: undefined}, 
        {name: u, template: 'bar', hints: ['foo', 'kk'], expression: 'bla {} bla'}]);
    });

    
    
  });
});

