'use strict';

require('source-map-support').install();
const assert = require('assert');
const Tokenizer = require('../../build/jel/Tokenizer.js').default;
const {Token, TokenType, RegExpToken, TemplateToken} = require('../../build/jel/Token.js');

describe('jelTokenizer', function() {
  describe('tokenize()', function() {
    
     it('should parse an empty string', function() {
      assert.deepEqual(Tokenizer.tokenize('').tokens, []);
      assert.deepEqual(Tokenizer.tokenize('   ').tokens, []);
     });

     it('should parse operators', function() {
      assert.deepEqual(Tokenizer.tokenize('<=+').tokens, [new Token(TokenType.Operator, '<='), new Token(TokenType.Operator, '+')]);
      assert.deepEqual(Tokenizer.tokenize('!a').tokens, [new Token(TokenType.Operator, '!'), new Token(TokenType.Identifier, 'a')]);
      assert.deepEqual(Tokenizer.tokenize('(a)').tokens, [new Token(TokenType.Operator, '('), new Token(TokenType.Identifier, 'a'), new Token(TokenType.Operator, ')')]);
      assert.deepEqual(Tokenizer.tokenize('{{}} {}').tokens, [new Token(TokenType.Operator, '{{'), new Token(TokenType.Operator, '}'), new Token(TokenType.Operator, '}'), new Token(TokenType.Operator, '{'), new Token(TokenType.Operator, '}')]);
    });

    it('should parse identifiers', function() {
      assert.deepEqual(Tokenizer.tokenize('a $_b0 c_d_093_d').tokens, [new Token(TokenType.Identifier, 'a'), new Token(TokenType.Identifier, '$_b0'), new Token(TokenType.Identifier, 'c_d_093_d')]);
    });

    
    it('should parse comments', function() {
      assert.deepEqual(Tokenizer.tokenize('a //comment\n $_b0 /*blabla*/ "d" f/*bla\nbla*/a').tokens, [new Token(TokenType.Identifier, 'a'), new Token(TokenType.Identifier, '$_b0'), new Token(TokenType.Literal, 'd'),
                                                                                               new Token(TokenType.Identifier, 'f'), new Token(TokenType.Identifier, 'a')]);
    });
    
    it('should parse values', function() {
      assert.deepEqual(Tokenizer.tokenize('3.5 null true "hello" "hi\\n\\"di\\"\\tho" \'huhu\'').tokens, [new Token(TokenType.Literal, 3.5), new Token(TokenType.Literal, null), new Token(TokenType.Literal, true),
                                                                         new Token(TokenType.Literal, 'hello'), new Token(TokenType.Literal, 'hi\n"di"\tho'), new Token(TokenType.Literal, 'huhu')]);
    });

    it('should parse patterns', function() {
      assert.deepEqual(Tokenizer.tokenize('`test` `te\\nst`').tokens, [new Token(TokenType.Pattern, 'test'), new Token(TokenType.Pattern, 'te\nst')]);
    });
    
    it('should parse expressions', function() {
      assert.deepEqual(Tokenizer.tokenize('a+1').tokens, [new Token(TokenType.Identifier, 'a'), new Token(TokenType.Operator, '+'), new Token(TokenType.Literal, 1)]);
      assert.deepEqual(Tokenizer.tokenize('a-1').tokens, [new Token(TokenType.Identifier, 'a'), new Token(TokenType.Operator, '-'), new Token(TokenType.Literal, 1)]);
      assert.deepEqual(Tokenizer.tokenize('a + 1').tokens, [new Token(TokenType.Identifier, 'a'), new Token(TokenType.Operator, '+'), new Token(TokenType.Literal, 1)]);
      assert.deepEqual(Tokenizer.tokenize('a  -  1').tokens, [new Token(TokenType.Identifier, 'a'), new Token(TokenType.Operator, '-'), new Token(TokenType.Literal, 1)]);
    });

    
    it('should provide peek(), last() and next()', function() {
      const t = Tokenizer.tokenize('1 2 3 4 5');
      assert.equal(t.hasNext(), true);
      assert.equal(t.peek().value, 1);
      assert.equal(t.peek().value, 1);
      assert.equal(t.last(), undefined);
      assert.equal(t.next().value, 1);
      assert.equal(t.last().value, 1);
      assert.equal(t.next().value, 2);
      assert.equal(t.last().value, 2);
      assert.equal(t.peek().value, 3);
      assert.equal(t.next().value, 3);
      assert.equal(t.next().value, 4);
      assert.equal(t.last().value, 4);
      assert.equal(t.next().value, 5);
      assert.equal(t.hasNext(), false);
    });
    
    it('should provide copy()', function() {
      const t = Tokenizer.tokenize('1 2 3 4 5');
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
      assert.equal(t.hasNext(), false);
      assert.equal(t2.next().value, 5);
      assert.equal(t2.hasNext(), false);
    });
  });
  
describe('tokenizePattern()', function() {
    
  it('should parse an empty string', function() {
      assert.deepEqual(Tokenizer.tokenizePattern('').tokens, []);
      assert.deepEqual(Tokenizer.tokenizePattern('   ').tokens, []);
    });

    it('should parse words and ops', function() {
      assert.deepEqual(Tokenizer.tokenizePattern('foo bar bar').tokens, [new Token(TokenType.Word, 'foo'), new Token(TokenType.Word, 'bar'), new Token(TokenType.Word, 'bar')]);
      assert.deepEqual(Tokenizer.tokenizePattern('   foo\n bar\nbar   \t  ').tokens, [new Token(TokenType.Word, 'foo'), new Token(TokenType.Word, 'bar'), new Token(TokenType.Word, 'bar')]);
      assert.deepEqual(Tokenizer.tokenizePattern('foo [bar|n42] [bar]?').tokens, [new Token(TokenType.Word, 'foo'), new Token(TokenType.Operator, '['), new Token(TokenType.Word, 'bar'), new Token(TokenType.Operator, '|'), new Token(TokenType.Word, 'n42'), 
                                                                           new Token(TokenType.Operator, ']'), new Token(TokenType.Operator, '['), new Token(TokenType.Word, 'bar'), new Token(TokenType.Operator, ']?')]);
    });

    it('should parse templates', function() {
      assert.deepEqual(Tokenizer.tokenizePattern('{{trr}} {{nl: g}} {{foo:bar.x}} {{bar.foo.kk::bla {} bla}}').tokens, [
        new TemplateToken(undefined, 'trr', new Set()), 
        new TemplateToken('nl', 'g', new Set()), 
        new TemplateToken('foo', 'bar', new Set(['x'])), 
        new TemplateToken(undefined, 'bar', new Set(['foo', 'kk']), 'bla {} bla')]);
    });

    it('should regexps templates', function() {
      assert.deepEqual(Tokenizer.tokenizePattern('{{/a/}} {{nl: /a/ /b/ /c\\/d/}} {{/x/:: bla}}').tokens, [
        new RegExpToken(undefined, ['a']), 
        new RegExpToken('nl', ['a', 'b', 'c/d']), 
        new RegExpToken(undefined, ['x'], 'bla')
      ]);
    });

  
  });
});

