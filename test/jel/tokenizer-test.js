'use strict';

require('source-map-support').install();
const assert = require('assert');
const Tokenizer = require('../../build/jel/Tokenizer.js').default;
const {Token, TokenType, RegExpToken, TemplateToken, FractionToken} = require('../../build/jel/Token.js');

describe('jelTokenizer', function() {
  describe('tokenize()', function() {
    
     it('should parse an empty string', function() {
      assert.deepEqual(Tokenizer.tokenize('').tokens, []);
      assert.deepEqual(Tokenizer.tokenize('   ').tokens, []);
     });

     it('should parse operators', function() {
      assert.deepEqual(Tokenizer.tokenize('<=+?').tokens, [new Token(1, 1, '(inline)', TokenType.Operator, '<='), new Token(1, 3, '(inline)', TokenType.Operator, '+'), new Token(1, 4, '(inline)', TokenType.Operator, '?')]);
      assert.deepEqual(Tokenizer.tokenize('!a').tokens, [new Token(1, 1, '(inline)', TokenType.Operator, '!'), new Token(1, 2, '(inline)', TokenType.Identifier, 'a')]);
      assert.deepEqual(Tokenizer.tokenize('!\na').tokens, [new Token(1, 1, '(inline)', TokenType.Operator, '!'), new Token(2, 1, '(inline)', TokenType.Identifier, 'a')]);
      assert.deepEqual(Tokenizer.tokenize('(a)').tokens, [new Token(1, 1, '(inline)', TokenType.Operator, '('), new Token(1, 2, '(inline)', TokenType.Identifier, 'a'), new Token(1, 3, '(inline)', TokenType.Operator, ')')]);
      assert.deepEqual(Tokenizer.tokenize('${}} {}').tokens, [new Token(1, 1, '(inline)', TokenType.Operator, '${'), new Token(1, 3, '(inline)', TokenType.Operator, '}'), new Token(1, 4, '(inline)', TokenType.Operator, '}'), new Token(1, 6, '(inline)', TokenType.Operator, '{}')]);
    });

    it('should parse identifiers', function() {
      assert.deepEqual(Tokenizer.tokenize('a _b0 c_d_093_d').tokens, [new Token(1, 1, '(inline)', TokenType.Identifier, 'a'), new Token(1, 3, '(inline)', TokenType.Identifier, '_b0'), new Token(1, 7, '(inline)', TokenType.Identifier, 'c_d_093_d')]);
      assert.deepEqual(Tokenizer.tokenize('Hello::World').tokens, [new Token(1, 1, '(inline)', TokenType.Identifier, 'Hello::World')]);
      assert.deepEqual(Tokenizer.tokenize('Hello::3').tokens, [new Token(1, 1, '(inline)', TokenType.Identifier, 'Hello'), new Token(1, 6, '(inline)', TokenType.Operator, ':'), new Token(1, 7, '(inline)', TokenType.Operator, ':'), new Token(1, 8, '(inline)', TokenType.Literal, 3)]);
    });

    it('should handle multiple lines', function() {
      assert.deepEqual(Tokenizer.tokenize('\na\nb\n\n    c').tokens, [new Token(2, 1, '(inline)', TokenType.Identifier, 'a'), new Token(3, 1, '(inline)', TokenType.Identifier, 'b'), new Token(5, 5, '(inline)', TokenType.Identifier, 'c')]);
    });

		
    
    it('should parse comments', function() {
      assert.deepEqual(Tokenizer.tokenize('a //comment\n __b0 /*blabla*/ "d" f/*bla\nbla*/a').tokens, [new Token(1, 1, '(inline)', TokenType.Identifier, 'a'), new Token(2, 2, '(inline)', TokenType.Identifier, '__b0'), new Token(2, 18, '(inline)', TokenType.Literal, 'd'),
                                                                                               new Token(2, 22, '(inline)', TokenType.Identifier, 'f'), new Token(3, 6, '(inline)', TokenType.Identifier, 'a')]);
    });
    
    it('should parse values', function() {
      assert.deepEqual(Tokenizer.tokenize('3.5 null true "hello" "hi\\n\\"di\\"\\tho" \'huhu\'').tokens, [new Token(1, 1, '(inline)', TokenType.Literal, 3.5), new Token(1, 5, '(inline)', TokenType.Literal, null), new Token(1, 10, '(inline)', TokenType.Literal, true),
                                                                         new Token(1, 15, '(inline)', TokenType.Literal, 'hello'), new Token(1, 23, '(inline)', TokenType.Literal, 'hi\n"di"\tho'), new Token(1, 40, '(inline)', TokenType.TemplateString, 'huhu')]);
      assert.deepEqual(Tokenizer.tokenize('1e3 1e-3 4e2 -4e2 2e-3 -273.16').tokens, [new Token(1, 1, '(inline)', TokenType.Literal, 1e3), new Token(1, 5, '(inline)', TokenType.Literal, 1e-3), new Token(1, 10, '(inline)', TokenType.Literal, 4e2), new Token(1, 14, '(inline)',
																																				TokenType.Operator, '-'), new Token(1, 15, '(inline)', TokenType.Literal, 4e2), new Token(1, 19, '(inline)', TokenType.Literal, 2e-3), 
																																				new Token(1, 24, '(inline)', TokenType.Operator, '-'), new Token(1, 25, '(inline)', TokenType.Literal, 273.16)]);
    });

	   it('should parse fractions', function() {
      assert.deepEqual(Tokenizer.tokenize('1/2 3.0 / 4 5 / 4').tokens, [new FractionToken(1, 1, '(inline)', 1, 2), new Token(1, 5, '(inline)', TokenType.Literal, 3), new Token(1, 9, '(inline)', TokenType.Operator, '/'),
																																			 new Token(1, 11, '(inline)', TokenType.Literal, 4), new FractionToken(1, 13, '(inline)', 5, 4)]);
    });

		
    it('should parse patterns', function() {
      assert.deepEqual(Tokenizer.tokenize('`test` `te\\nst`').tokens, [new Token(1, 1, '(inline)', TokenType.Pattern, 'test'), new Token(1, 8, '(inline)', TokenType.Pattern, 'te\nst')]);
    });
    
    it('should parse expressions', function() {
      assert.deepEqual(Tokenizer.tokenize('a+1').tokens, [new Token(1, 1, '(inline)', TokenType.Identifier, 'a'), new Token(1, 2, '(inline)', TokenType.Operator, '+'), new Token(1, 3, '(inline)', TokenType.Literal, 1)]);
      assert.deepEqual(Tokenizer.tokenize('a-1').tokens, [new Token(1, 1, '(inline)', TokenType.Identifier, 'a'), new Token(1, 2, '(inline)', TokenType.Operator, '-'), new Token(1, 3, '(inline)', TokenType.Literal, 1)]);
      assert.deepEqual(Tokenizer.tokenize('a + 1').tokens, [new Token(1, 1, '(inline)', TokenType.Identifier, 'a'), new Token(1, 3, '(inline)', TokenType.Operator, '+'), new Token(1, 5, '(inline)', TokenType.Literal, 1)]);
      assert.deepEqual(Tokenizer.tokenize('a  -  1').tokens, [new Token(1, 1, '(inline)', TokenType.Identifier, 'a'), new Token(1, 4, '(inline)', TokenType.Operator, '-'), new Token(1, 7, '(inline)', TokenType.Literal, 1)]);
      assert.deepEqual(Tokenizer.tokenize('{f: x=>x-273.15}').tokens, [new Token(1, 1, '(inline)', TokenType.Operator, '{'), new Token(1, 2, '(inline)', TokenType.Identifier, 'f'), new Token(1, 3, '(inline)', TokenType.Operator, ':'),
																																			 new Token(1, 5, '(inline)', TokenType.Identifier, 'x'), new Token(1, 6, '(inline)', TokenType.Operator, '=>'), new Token(1, 8, '(inline)', TokenType.Identifier, 'x'),
																																			 new Token(1, 9, '(inline)', TokenType.Operator, '-'), new Token(1, 10, '(inline)', TokenType.Literal, 273.15), new Token(1, 16, '(inline)', TokenType.Operator, '}')]);
    });

    
		
		
    it('should provide peek(), last() and next()', function() {
      const t = Tokenizer.tokenize('1 2 3 4 5', '(unit test)');
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
      const t = Tokenizer.tokenize('1 2 3 4 5', '(unit test)');
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
      assert.deepEqual(Tokenizer.tokenizePattern(1, 1, '(unit test)', '').tokens, []);
      assert.deepEqual(Tokenizer.tokenizePattern(1, 1, '(unit test)', '   ').tokens, []);
    });

    it('should parse words and ops', function() {
      assert.deepEqual(Tokenizer.tokenizePattern(4, 2, '(inline)', 'foo bar bar').tokens, [new Token(4, 2, '(inline)', TokenType.Word, 'foo'), new Token(4, 6, '(inline)', TokenType.Word, 'bar'), new Token(4, 10, '(inline)', TokenType.Word, 'bar')]);
      assert.deepEqual(Tokenizer.tokenizePattern(4, 2, '(inline)', '   foo\n bar\nbar   \t  ').tokens, [new Token(4, 2, '(inline)', TokenType.Word, 'foo'), new Token(4, 10, '(inline)', TokenType.Word, 'bar'), new Token(4, 14, '(inline)', TokenType.Word, 'bar')]);
      assert.deepEqual(Tokenizer.tokenizePattern(4, 2, '(inline)', 'foo [bar|n42] [bar]?').tokens, [new Token(4, 2, '(inline)', TokenType.Word, 'foo'), new Token(4, 6, '(inline)', TokenType.Operator, '['), new Token(4, 7, '(inline)', TokenType.Word, 'bar'), new Token(4, 10, '(inline)', TokenType.Operator, '|'), new Token(4, 11, '(inline)', TokenType.Word, 'n42'), 
                                                                           new Token(4, 14, '(inline)', TokenType.Operator, ']'), new Token(4, 16, '(inline)', TokenType.Operator, '['), new Token(4, 17, '(inline)', TokenType.Word, 'bar'), new Token(4, 20, '(inline)', TokenType.Operator, ']?')]);
    });

    it('should parse templates', function() {
      assert.deepEqual(Tokenizer.tokenizePattern(4, 2, '(unit test)', '{{trr}} {{nl: g}} {{foo:bar.x}} {{bar.foo.kk::bla {} bla}}').tokens, [
        new TemplateToken(4, 2, '(unit test)', undefined, 'trr', new Set()), 
        new TemplateToken(4, 10, '(unit test)', 'nl', 'g', new Set()), 
        new TemplateToken(4, 20, '(unit test)', 'foo', 'bar', new Set(['x'])), 
        new TemplateToken(4, 34, '(unit test)', undefined, 'bar', new Set(['foo', 'kk']), 'bla {} bla')]);
    });

    it('should regexps templates', function() {
      assert.deepEqual(Tokenizer.tokenizePattern(4, 2, '(unit test)', '{{/a/}} {{nl: /a/ /b/ /c\\/d/}} {{/x/:: bla}}').tokens, [
        new RegExpToken(4, 2, '(unit test)', undefined, ['a']), 
        new RegExpToken(4, 10, '(unit test)', 'nl', ['a', 'b', 'c/d']), 
        new RegExpToken(4, 33, '(unit test)', undefined, ['x'], 'bla')
      ]);
    });
  });
  
  describe('tokenizeTemplateString()', function() {
    
    it('should parse an empty string', function() {
      assert.deepEqual(Tokenizer.tokenizeTemplateString(1, 1, '(inline)', '').tokens, []);
      assert.deepEqual(Tokenizer.tokenizeTemplateString(1, 1, '(inline)', '   ').tokens, [new Token(1, 1, '(inline)', TokenType.StringFragment, '   ')]);
    });

    it('should parse strings with escapes', function() {
      assert.deepEqual(Tokenizer.tokenizeTemplateString(4, 2, '(inline)', 'foo bar bar').tokens, [new Token(4, 2, '(inline)', TokenType.StringFragment, 'foo bar bar')]);
      assert.deepEqual(Tokenizer.tokenizeTemplateString(4, 2, '(inline)', 'foo\n\tbar').tokens, [new Token(4, 2, '(inline)', TokenType.StringFragment, 'foo\n\tbar')]);
      assert.deepEqual(Tokenizer.tokenizeTemplateString(4, 2, '(inline)', 'foo{}bar\\{\\{ bla').tokens, [new Token(4, 2, '(inline)', TokenType.StringFragment, 'foo{}bar{{ bla')]);
    });

    it('should parse templates', function() {
      assert.deepEqual(Tokenizer.tokenizeTemplateString(4, 2, '(inline)', '{{trr}} {{nl: {} }}').tokens, [
        new Token(4, 2, '(inline)', TokenType.Expression, 'trr'), 
        new Token(4, 9, '(inline)', TokenType.StringFragment, ' '), 
        new Token(4, 10, '(inline)', TokenType.Expression, 'nl: {} ')]);
    });
  });

});

