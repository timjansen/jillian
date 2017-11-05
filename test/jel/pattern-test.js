'use strict';

const assert = require('assert');
const JEL = require('../../build/jel/JEL.js').default;
const Pattern = require('../../build/jel/types/Pattern.js').default;
const Dictionary = require('../../build/jel/types/Dictionary.js').default;
const Translator = require('../../build/jel/types/Translator.js').default;
const Context = require('../../build/jel/Context.js').default;
const PatternNode = require('../../build/jel/patternNodes/PatternNode.js').default;
const TemplateNode = require('../../build/jel/patternNodes/TemplateNode.js').default;
const RegExpNode = require('../../build/jel/patternNodes/RegExpNode.js').default;

function exec(s) {
  return new JEL(s).executeImmediately();
}

const TERMINATOR = new PatternNode();

function mnt(token, next = TERMINATOR) {
  return new PatternNode().addTokenMatch(token, next);
}


describe('jelPatterns', function() {
  describe('parse()', function() {
    
    it('should parse an empty string', function() {
      assert.equal(JEL.createPattern('').tree.toString(), TERMINATOR);
      assert.equal(JEL.createPattern('   ').tree.toString(), TERMINATOR);
    });

    it('should parse simple patterns', function() {
      assert.equal(JEL.createPattern('a b c').tree.toString(), mnt('a', mnt('b', mnt('c'))).toString());
      assert.equal(JEL.createPattern(' foo bar mi:3 double-dash ').tree.toString(), mnt('foo', mnt('bar', mnt('mi:3', mnt('double-dash')))).toString());
    });

    it('should parse optional patterns', function() {
      assert.equal(JEL.createPattern('[x]?').tree.toString(), mnt('x').makeOptional(TERMINATOR).toString());
      
      const y = mnt('y');
      assert.equal(JEL.createPattern('[x]? y').tree.toString(), mnt('x', y).makeOptional(y).toString());

      const e = mnt('e', null).makeOptional(TERMINATOR);
      const cd = mnt('c', mnt('d', null)).makeOptional(e);
      const b = mnt('b', cd);
      const a = mnt('a', null).makeOptional(b);
      assert.equal(JEL.createPattern('[a]? b [c d]? [e]?').tree.toString(), a.toString());
    });
    it('should parse multi-patterns', function() {
      assert.equal(JEL.createPattern('[x]').tree.toString(), mnt('x').toString());
      assert.equal(JEL.createPattern('[x|y z]').tree.toString(), mnt('x').addTokenMatch('y', mnt('z')).toString());
      
      const a = mnt('a');
      assert.equal(JEL.createPattern('[x|y|z] a').tree.toString(), mnt('x', a).addTokenMatch('y', a).addTokenMatch('z', a).toString());
    });


    it('should parse optional multi-patterns', function() {
      assert.equal(JEL.createPattern('[x|y z]?').tree.toString(), mnt('x').addTokenMatch('y', mnt('z', null)).makeOptional(TERMINATOR).toString());
      
      const a = mnt('a');
      assert.equal(JEL.createPattern('[x|y|z]? a').tree.toString(), mnt('x', null).addTokenMatch('y', null).addTokenMatch('z', null).makeOptional(a).toString());
    });

    it('should parse templates', function() {
      assert.equal(JEL.createPattern('j {{tpl0}}').tree.toString(), mnt('j', new PatternNode().addTemplateMatch(new TemplateNode('tpl0', undefined, [], undefined, TERMINATOR))).toString());
      assert.equal(JEL.createPattern('a {{tpl.x}} c').tree.toString(), mnt('a', new PatternNode().addTemplateMatch(new TemplateNode('tpl', undefined, ['x'], undefined, mnt('c')))).toString());
      assert.equal(JEL.createPattern('a {{test: tpl.x.y :: test > 0}} c').tree.toString(), mnt('a', new PatternNode().addTemplateMatch(new TemplateNode('tpl', 'test', ['x','y'], JEL.parseTree('test > 0'), mnt('c')))).toString());
      assert.equal(JEL.createPattern('j [{{tpl0}}]?').tree.toString(), mnt('j', new PatternNode().addTemplateMatch(new TemplateNode('tpl0', undefined, [], undefined, TERMINATOR)).makeOptional(TERMINATOR)).toString());
    });

    it('should parse regexp templates', function() {
      assert.equal(JEL.createPattern('j {{/tpl0/}}').tree.toString(), mnt('j', new PatternNode().addTemplateMatch(new RegExpNode([/^tpl0$/], undefined, undefined, TERMINATOR))).toString());
      assert.equal(JEL.createPattern('a {{/n/ /m/}} c').tree.toString(), mnt('a', new PatternNode().addTemplateMatch(new RegExpNode([/^n$/, /^m$/], undefined, undefined, mnt('c')))).toString());
      assert.equal(JEL.createPattern('a {{test: /abc+/ :: test > 0}} c').tree.toString(), mnt('a', new PatternNode().addTemplateMatch(new RegExpNode([/^abc+$/], 'test', JEL.parseTree('test > 0'), mnt('c')))).toString());
      assert.equal(JEL.createPattern('j [{{/t/}}]?').tree.toString(), mnt('j', new PatternNode().addTemplateMatch(new RegExpNode([/^t$/], undefined, undefined, TERMINATOR)).makeOptional(TERMINATOR)).toString());
    });

  });
  
  describe('match()', function() {
    const ctx = new Context();
    
     it('match artificial patterns', function() {
      assert(!new Pattern(mnt('x'), "x").match(ctx, []));
      assert(new Pattern(mnt('x'), "x").match(ctx, ['x']));
      assert(!new Pattern(mnt('x'), "x").match(ctx, ['y']));
      assert(!new Pattern(mnt('x'), "x").match(ctx, ['x', 'y']));
     }); 
    
    it('should match an empty string', function() {
      assert(JEL.createPattern('').match(ctx, ''));
      assert(JEL.createPattern('').match(ctx, '   '));
      assert(JEL.createPattern('').match(ctx, []));
      assert(!JEL.createPattern('').match(ctx, 'a'));
    });

    it('should match simple patterns', function() {
      assert(JEL.createPattern('a b c').match(ctx, ['a', 'b', 'c']));
      assert(JEL.createPattern('a b c').match(ctx, 'a b c'));
      assert(JEL.createPattern('a b c').match(ctx, '  a b c  '));
      assert(!JEL.createPattern('a b c').match(ctx, 'a b d'));
      assert(!JEL.createPattern('a b c').match(ctx, 'd b c'));
      assert(!JEL.createPattern('a b c').match(ctx, 'a b c d'));
      assert(!JEL.createPattern('a b c').match(ctx, ['a', 'b', 'd']));
    });

    it('should match optional patterns', function() {
      assert(JEL.createPattern('[x]?').match(ctx, 'x'));
      assert(JEL.createPattern('[x]?').match(ctx, []));
      assert(JEL.createPattern('[x]?').match(ctx, ''));
      assert(!JEL.createPattern('[x]?').match(ctx, 'y'));
      assert(JEL.createPattern('[x]? y').match(ctx, 'x y'));
      assert(JEL.createPattern('[x]? y').match(ctx, 'y'));
      assert(!JEL.createPattern('[x]? y').match(ctx, 'x'));
      assert(JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, 'a b c d e'));
      assert(JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, ' b '));
      assert(JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, 'a b c d'));
      assert(JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, 'b c d'));
      assert(!JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, 'c d'));
      assert(!JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, 'a b c e'));
      assert(!JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, 'a b c'));
      assert(!JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, ''));
      assert(!JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, 'x a b c d e'));
      assert(!JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, ' a b c d e f'));
      assert(!JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, ' b d c'));
      assert(!JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, ' b x'));
    });

    it('should match multi-patterns', function() {
      assert(JEL.createPattern('[x]').match(ctx, 'x'));
      assert(!JEL.createPattern('[x]').match(ctx, 'y'));
      
      assert(JEL.createPattern('[x|y z]').match(ctx, 'x'));
      assert(JEL.createPattern('[x|y z]').match(ctx, 'y z'));
      assert(!JEL.createPattern('[x|y z]').match(ctx, 'x y z'));
      assert(!JEL.createPattern('[x|y z]').match(ctx, ''));
      
      assert(JEL.createPattern('[x|y|z] a').match(ctx, 'x a'));
      assert(JEL.createPattern('foo [x|y|z] a b').match(ctx, 'foo z a b'));
      assert(!JEL.createPattern('[x|y|z] a').match(ctx, 'z'));
      assert(!JEL.createPattern('[x|y|z] a').match(ctx, 'z a h'));
      assert(!JEL.createPattern('[x|y|z] a').match(ctx, 'h y a'));
      assert(!JEL.createPattern('[x|y|z] a').match(ctx, 'a a'));
    });

    it('should match optional multi-patterns', function() {
      assert(JEL.createPattern('[x|y z]?').match(ctx, ''));
      assert(JEL.createPattern('[x|y z]?').match(ctx, 'x'));
      assert(JEL.createPattern('[x|y z]?').match(ctx, 'y z'));
      assert(!JEL.createPattern('[x|y z]?').match(ctx, 'x y z'));
  
      assert(JEL.createPattern('[x|y|z]? a').match(ctx, 'y a'));
      assert(JEL.createPattern('[x|y|z]? a').match(ctx, 'a'));
      assert(!JEL.createPattern('[x|y|z]? a').match(ctx, 'x'));
      assert(!JEL.createPattern('[x|y|z]? a').match(ctx, 'y a k'));
    });

    it('should match templates', function() {
        const tpl0 = exec('{{`a` => 1}}');
        const tpl1 = exec('{{`a` => 1, x: `b` => 2, y: `b` => 12, x, y: `b` => 22}}');
        const tpl2 = exec('{{`a [b [c]?]?` => 3, `a b c` => 4, `d e` => 5, `f {{tpl1}}` => 6}}');
        const dict = new Dictionary({tpl0, tpl1, tpl2});
        const ctx = new Context(null, null, dict);

        assert(JEL.createPattern('{{tpl0}}').match(ctx, 'a'));
        assert(JEL.createPattern('j {{tpl0}}').match(ctx, 'j a '));
      
        assert(JEL.createPattern('a {{tpl0}}').match(ctx, 'a a'));
        assert(JEL.createPattern('{{tpl0}} k').match(ctx, ' a k'));
        assert(JEL.createPattern('{{tpl0}}{{tpl0}}').match(ctx, 'a a'));
        assert(JEL.createPattern('{{tpl0}} {{tpl0}}').match(ctx, 'a a'));
        assert(!JEL.createPattern('{{tpl0}}').match(ctx, 'b'));
      
        assert(JEL.createPattern('{{tpl1}}').match(ctx, 'a'));
        assert(JEL.createPattern('{{tpl1}}').match(ctx, 'b'));
        assert(JEL.createPattern('{{tpl1.x}}').match(ctx, 'b'));
        assert(JEL.createPattern('{{tpl1.x.y}}').match(ctx, 'b'));
        assert(!JEL.createPattern('{{tpl1}}').match(ctx, 'nope'));
        assert(!JEL.createPattern('{{tpl1.x}}').match(ctx, 'a'));
        assert(!JEL.createPattern('{{tpl1.x.y.z}}').match(ctx, 'b'));

        assert(JEL.createPattern('{{t: tpl1 :: t == 12}}').match(ctx, 'b'));
        assert(JEL.createPattern('{{t: tpl1 :: t == 22}}').match(ctx, 'b'));
        assert(!JEL.createPattern('{{t: tpl1 :: t == 0}}').match(ctx, 'b'));
        assert(!JEL.createPattern('{{t: tpl1.x :: t == 12}}').match(ctx, 'b'));
        assert(JEL.createPattern('{{t: tpl1.x :: t == 22}}').match(ctx, 'b'));
        assert(JEL.createPattern('{{test: tpl1 :: test == 1}}').match(ctx, 'a'));
        assert(!JEL.createPattern('{{test: tpl1 :: test > 1}}').match(ctx, 'a'));
    });

    it('should match regexp templates', function() {
        const ctx = new Context();

        assert(JEL.createPattern('{{/a+/}}').match(ctx, 'aa'));
        assert(JEL.createPattern('j {{/a+/}}').match(ctx, 'j aaa '));
      
        assert(JEL.createPattern('a {{/a+/}}').match(ctx, 'a a'));
        assert(JEL.createPattern('{{/b/ /c/}} k').match(ctx, 'b c  k'));
        assert(JEL.createPattern('{{/b/}}{{/c/}}k').match(ctx, 'b c k'));
        assert(JEL.createPattern('{{/b/}} {{/c/}} k').match(ctx, 'b c k'));
        assert(!JEL.createPattern('{{/ab+/}}').match(ctx, 'a'));
      
        assert(JEL.createPattern('{{a: /a+b*c+/}}').match(ctx, 'aaaacc'));
        assert(!JEL.createPattern('{{/a+b*c+/}}').match(ctx, 'aaaab'));
        assert(!JEL.createPattern('{{/a/}}').match(ctx, 'ab'));

        assert(JEL.createPattern('{{t: /[0-9]+/ :: t == "12"}}').match(ctx, '12'));
        assert(!JEL.createPattern('{{t: /[0-9]+/ :: t == "12"}}').match(ctx, '123'));

        assert(JEL.createPattern('{{t: /([0-9])([0-9])([a-z])/ :: t[0] == "2" && t[1] == "5" && t[2] == "x"}}').match(ctx, '25x'));
        assert(!JEL.createPattern('{{t: /([0-9])([0-9])([a-z])/ :: t[0] == "2" && t[1] == "5" && t[2] == "x"}}').match(ctx, '25y'));
        assert(!JEL.createPattern('{{t: /([0-9])([0-9])([a-z])/ :: t[0] == "2" && t[1] == "5" && t[2] == "x"}}').match(ctx, '15y'));
        assert(!JEL.createPattern('{{t: /([0-9])([0-9])([a-z])/ :: t[0] == "2" && t[1] == "5" && t[2] == "x"}}').match(ctx, 'abc'));

        assert(JEL.createPattern('{{t: /[0-9]/ /[0-9]/ /[a-z]/ :: t[0] == "2" && t[1] == "5" && t[2] == "x"}}').match(ctx, '2 5 x'));
        assert(!JEL.createPattern('{{t: /[0-9]/ /[0-9]/ /[a-z]/ :: t[0] == "2" && t[1] == "5" && t[2] == "x"}}').match(ctx, '2 6 x'));

        assert(JEL.createPattern('{{t: /([0-9])(a+)/ /b+/ :: t[0][0] == "7" && t[0][1] == "aa" && t[1] == "bbb"}}').match(ctx, '7aa bbb'));
        assert(!JEL.createPattern('{{t: /([0-9])(a+)/ /b+/ :: t[0][0] == "7" && t[0][1] == "aa" && t[1] == "bbb"}}').match(ctx, '7 bbb'));
        assert(!JEL.createPattern('{{t: /([0-9])(a+)/ /b+/ :: t[0][0] == "7" && t[0][1] == "aa" && t[1] == "bbb"}}').match(ctx, '7aaa bb'));

        assert(JEL.createPattern('a [{{/b/}} {{/c/}} {{/d/}}]? e').match(ctx, 'a b c d e'));
        assert(JEL.createPattern('a [{{/b/}} {{/c/}} {{/d/}}]? e').match(ctx, 'a e'));
        assert(!JEL.createPattern('a [{{/b/}} {{/c/}} {{/d/}}]? e').match(ctx, 'a b e'));
        assert(!JEL.createPattern('a [{{/b/}} {{/c/}} {{/d/}}]? e').match(ctx, 'a b c e'));
        assert(!JEL.createPattern('a [{{/b/}} {{/c/}} {{/d/}}]? e').match(ctx, 'a b c d'));
        assert(!JEL.createPattern('a [{{/b/}} {{/c/}} {{/d/}}]? e').match(ctx, 'a b d e'));
    });
    
    
  });
  
});

