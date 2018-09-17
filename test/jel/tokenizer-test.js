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
      assert.deepEqual(Tokenizer.tokenize('<=+').tokens, [new Token(1, 1, TokenType.Operator, '<='), new Token(1, 3, TokenType.Operator, '+')]);
      assert.deepEqual(Tokenizer.tokenize('!a').tokens, [new Token(1, 1, TokenType.Operator, '!'), new Token(1, 2, TokenType.Identifier, 'a')]);
      assert.deepEqual(Tokenizer.tokenize('!\na').tokens, [new Token(1, 1, TokenType.Operator, '!'), new Token(2, 1, TokenType.Identifier, 'a')]);
      assert.deepEqual(Tokenizer.tokenize('(a)').tokens, [new Token(1, 1, TokenType.Operator, '('), new Token(1, 2, TokenType.Identifier, 'a'), new Token(1, 3, TokenType.Operator, ')')]);
      assert.deepEqual(Tokenizer.tokenize('${}} {}').tokens, [new Token(1, 1, TokenType.Operator, '${'), new Token(1, 3, TokenType.Operator, '}'), new Token(1, 4, TokenType.Operator, '}'), new Token(1, 6, TokenType.Operator, '{'), new Token(1, 7, TokenType.Operator, '}')]);
    });

    it('should parse identifiers', function() {
      assert.deepEqual(Tokenizer.tokenize('a $_b0 c_d_093_d').tokens, [new Token(1, 1, TokenType.Identifier, 'a'), new Token(1, 3, TokenType.Identifier, '$_b0'), new Token(1, 8, TokenType.Identifier, 'c_d_093_d')]);
    });

    it('should handle multiple lines', function() {
      assert.deepEqual(Tokenizer.tokenize('\na\nb\n\n    c').tokens, [new Token(2, 1, TokenType.Identifier, 'a'), new Token(3, 1, TokenType.Identifier, 'b'), new Token(5, 5, TokenType.Identifier, 'c')]);
    });

		
    
    it('should parse comments', function() {
      assert.deepEqual(Tokenizer.tokenize('a //comment\n $_b0 /*blabla*/ "d" f/*bla\nbla*/a').tokens, [new Token(1, 1, TokenType.Identifier, 'a'), new Token(2, 2, TokenType.Identifier, '$_b0'), new Token(2, 18, TokenType.Literal, 'd'),
                                                                                               new Token(2, 22, TokenType.Identifier, 'f'), new Token(3, 6, TokenType.Identifier, 'a')]);
    });
    
    it('should parse values', function() {
      assert.deepEqual(Tokenizer.tokenize('3.5 null true "hello" "hi\\n\\"di\\"\\tho" \'huhu\'').tokens, [new Token(1, 1, TokenType.Literal, 3.5), new Token(1, 5, TokenType.Literal, null), new Token(1, 10, TokenType.Literal, true),
                                                                         new Token(1, 15, TokenType.Literal, 'hello'), new Token(1, 23, TokenType.Literal, 'hi\n"di"\tho'), new Token(1, 40, TokenType.Literal, 'huhu')]);
      assert.deepEqual(Tokenizer.tokenize('1e3 1e-3 4e2 -4e2 2e-3 -273.16').tokens, [new Token(1, 1, TokenType.Literal, 1e3), new Token(1, 5, TokenType.Literal, 1e-3), new Token(1, 10, TokenType.Literal, 4e2), new Token(1, 14, 
																																				TokenType.Operator, '-'), new Token(1, 15, TokenType.Literal, 4e2), new Token(1, 19, TokenType.Literal, 2e-3), 
																																				new Token(1, 24, TokenType.Operator, '-'), new Token(1, 25, TokenType.Literal, 273.16)]);
    });

    it('should parse patterns', function() {
      assert.deepEqual(Tokenizer.tokenize('`test` `te\\nst`').tokens, [new Token(1, 1, TokenType.Pattern, 'test'), new Token(1, 8, TokenType.Pattern, 'te\nst')]);
    });
    
    it('should parse expressions', function() {
      assert.deepEqual(Tokenizer.tokenize('a+1').tokens, [new Token(1, 1, TokenType.Identifier, 'a'), new Token(1, 2, TokenType.Operator, '+'), new Token(1, 3, TokenType.Literal, 1)]);
      assert.deepEqual(Tokenizer.tokenize('a-1').tokens, [new Token(1, 1, TokenType.Identifier, 'a'), new Token(1, 2, TokenType.Operator, '-'), new Token(1, 3, TokenType.Literal, 1)]);
      assert.deepEqual(Tokenizer.tokenize('a + 1').tokens, [new Token(1, 1, TokenType.Identifier, 'a'), new Token(1, 3, TokenType.Operator, '+'), new Token(1, 5, TokenType.Literal, 1)]);
      assert.deepEqual(Tokenizer.tokenize('a  -  1').tokens, [new Token(1, 1, TokenType.Identifier, 'a'), new Token(1, 4, TokenType.Operator, '-'), new Token(1, 7, TokenType.Literal, 1)]);
      assert.deepEqual(Tokenizer.tokenize('{f: x=>x-273.15}').tokens, [new Token(1, 1, TokenType.Operator, '{'), new Token(1, 2, TokenType.Identifier, 'f'), new Token(1, 3, TokenType.Operator, ':'),
																																			 new Token(1, 5, TokenType.Identifier, 'x'), new Token(1, 6, TokenType.Operator, '=>'), new Token(1, 8, TokenType.Identifier, 'x'),
																																			 new Token(1, 9, TokenType.Operator, '-'), new Token(1, 10, TokenType.Literal, 273.15), new Token(1, 16, TokenType.Operator, '}')]);
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
      assert.deepEqual(Tokenizer.tokenizePattern(1, 1, '').tokens, []);
      assert.deepEqual(Tokenizer.tokenizePattern(1, 1, '   ').tokens, []);
    });

    it('should parse words and ops', function() {
      assert.deepEqual(Tokenizer.tokenizePattern(4, 2, 'foo bar bar').tokens, [new Token(4, 2, TokenType.Word, 'foo'), new Token(4, 2, TokenType.Word, 'bar'), new Token(4, 2, TokenType.Word, 'bar')]);
      assert.deepEqual(Tokenizer.tokenizePattern(4, 2, '   foo\n bar\nbar   \t  ').tokens, [new Token(4, 2, TokenType.Word, 'foo'), new Token(4, 2, TokenType.Word, 'bar'), new Token(4, 2, TokenType.Word, 'bar')]);
      assert.deepEqual(Tokenizer.tokenizePattern(4, 2, 'foo [bar|n42] [bar]?').tokens, [new Token(4, 2, TokenType.Word, 'foo'), new Token(4, 2, TokenType.Operator, '['), new Token(4, 2, TokenType.Word, 'bar'), new Token(4, 2, TokenType.Operator, '|'), new Token(4, 2, TokenType.Word, 'n42'), 
                                                                           new Token(4, 2, TokenType.Operator, ']'), new Token(4, 2, TokenType.Operator, '['), new Token(4, 2, TokenType.Word, 'bar'), new Token(4, 2, TokenType.Operator, ']?')]);
    });

    it('should parse templates', function() {
      assert.deepEqual(Tokenizer.tokenizePattern(4, 2, '{{trr}} {{nl: g}} {{foo:bar.x}} {{bar.foo.kk::bla {} bla}}').tokens, [
        new TemplateToken(4, 2, undefined, 'trr', new Set()), 
        new TemplateToken(4, 2, 'nl', 'g', new Set()), 
        new TemplateToken(4, 2, 'foo', 'bar', new Set(['x'])), 
        new TemplateToken(4, 2, undefined, 'bar', new Set(['foo', 'kk']), 'bla {} bla')]);
    });

    it('should regexps templates', function() {
      assert.deepEqual(Tokenizer.tokenizePattern(4, 2, '{{/a/}} {{nl: /a/ /b/ /c\\/d/}} {{/x/:: bla}}').tokens, [
        new RegExpToken(4, 2, undefined, ['a']), 
        new RegExpToken(4, 2, 'nl', ['a', 'b', 'c/d']), 
        new RegExpToken(4, 2, undefined, ['x'], 'bla')
      ]);
    });

  
  });
});

