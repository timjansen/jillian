'use strict';

require('source-map-support').install();
const assert = require('assert');
const DefaultContext = require('../../build/jel/DefaultContext.js').default;
const Context = require('../../build/jel/Context.js').default;
const JEL = require('../../build/jel/JEL.js').default;
const Pattern = require('../../build/jel/types/Pattern.js').default;
const Dictionary = require('../../build/jel/types/Dictionary.js').default;
const JelBoolean = require('../../build/jel/types/JelBoolean.js').default;
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
  let ctx;
  before(function(){
    return DefaultContext.get().then(dc=> {
      ctx = dc;
    });

  });

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
     it('match artificial patterns', function() {
      assert.equal(JelBoolean.FALSE, new Pattern(mnt('x'), "x").match(ctx, []));
      assert.equal(JelBoolean.TRUE, new Pattern(mnt('x'), "x").match(ctx, ['x']));
      assert.equal(JelBoolean.FALSE, new Pattern(mnt('x'), "x").match(ctx, ['y']));
      assert.equal(JelBoolean.FALSE, new Pattern(mnt('x'), "x").match(ctx, ['x', 'y']));
     }); 
    
    it('should match an empty string', function() {
      assert.equal(JelBoolean.TRUE, JEL.createPattern('').match(ctx, ''));
      assert.equal(JelBoolean.TRUE, JEL.createPattern('').match(ctx, '   '));
      assert.equal(JelBoolean.TRUE, JEL.createPattern('').match(ctx, []));
      assert.equal(JelBoolean.FALSE, JEL.createPattern('').match(ctx, 'a'));
    });

    it('should match simple patterns', function() {
      assert.equal(JelBoolean.TRUE, JEL.createPattern('a b c').match(ctx, ['a', 'b', 'c']));
      assert.equal(JelBoolean.TRUE, JEL.createPattern('a b c').match(ctx, 'a b c'));
      assert.equal(JelBoolean.TRUE, JEL.createPattern('a b c').match(ctx, '  a b c  '));
      assert.equal(JelBoolean.FALSE, JEL.createPattern('a b c').match(ctx, 'a b d'));
      assert.equal(JelBoolean.FALSE, JEL.createPattern('a b c').match(ctx, 'd b c'));
      assert.equal(JelBoolean.FALSE, JEL.createPattern('a b c').match(ctx, 'a b c d'));
      assert.equal(JelBoolean.FALSE, JEL.createPattern('a b c').match(ctx, ['a', 'b', 'd']));
    });

    it('should match optional patterns', function() {
      assert.equal(JelBoolean.TRUE, JEL.createPattern('[x]?').match(ctx, 'x'));
      assert.equal(JelBoolean.TRUE, JEL.createPattern('[x]?').match(ctx, []));
      assert.equal(JelBoolean.TRUE, JEL.createPattern('[x]?').match(ctx, ''));
      assert.equal(JelBoolean.FALSE, JEL.createPattern('[x]?').match(ctx, 'y'));
      assert.equal(JelBoolean.TRUE, JEL.createPattern('[x]? y').match(ctx, 'x y'));
      assert.equal(JelBoolean.TRUE, JEL.createPattern('[x]? y').match(ctx, 'y'));
      assert.equal(JelBoolean.FALSE, JEL.createPattern('[x]? y').match(ctx, 'x'));
      assert.equal(JelBoolean.TRUE, JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, 'a b c d e'));
      assert.equal(JelBoolean.TRUE, JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, ' b '));
      assert.equal(JelBoolean.TRUE, JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, 'a b c d'));
      assert.equal(JelBoolean.TRUE, JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, 'b c d'));
      assert.equal(JelBoolean.FALSE, JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, 'c d'));
      assert.equal(JelBoolean.FALSE, JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, 'a b c e'));
      assert.equal(JelBoolean.FALSE, JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, 'a b c'));
      assert.equal(JelBoolean.FALSE, JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, ''));
      assert.equal(JelBoolean.FALSE, JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, 'x a b c d e'));
      assert.equal(JelBoolean.FALSE, JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, ' a b c d e f'));
      assert.equal(JelBoolean.FALSE, JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, ' b d c'));
      assert.equal(JelBoolean.FALSE, JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, ' b x'));
    });

    it('should match multi-patterns', function() {
      assert.equal(JelBoolean.TRUE, JEL.createPattern('[x]').match(ctx, 'x'));
      assert.equal(JelBoolean.FALSE, JEL.createPattern('[x]').match(ctx, 'y'));
      
      assert.equal(JelBoolean.TRUE, JEL.createPattern('[x|y z]').match(ctx, 'x'));
      assert.equal(JelBoolean.TRUE, JEL.createPattern('[x|y z]').match(ctx, 'y z'));
      assert.equal(JelBoolean.FALSE, JEL.createPattern('[x|y z]').match(ctx, 'x y z'));
      assert.equal(JelBoolean.FALSE, JEL.createPattern('[x|y z]').match(ctx, ''));
      
      assert.equal(JelBoolean.TRUE, JEL.createPattern('[x|y|z] a').match(ctx, 'x a'));
      assert.equal(JelBoolean.TRUE, JEL.createPattern('foo [x|y|z] a b').match(ctx, 'foo z a b'));
      assert.equal(JelBoolean.FALSE, JEL.createPattern('[x|y|z] a').match(ctx, 'z'));
      assert.equal(JelBoolean.FALSE, JEL.createPattern('[x|y|z] a').match(ctx, 'z a h'));
      assert.equal(JelBoolean.FALSE, JEL.createPattern('[x|y|z] a').match(ctx, 'h y a'));
      assert.equal(JelBoolean.FALSE, JEL.createPattern('[x|y|z] a').match(ctx, 'a a'));
    });

    it('should match optional multi-patterns', function() {
      assert.equal(JelBoolean.TRUE, JEL.createPattern('[x|y z]?').match(ctx, ''));
      assert.equal(JelBoolean.TRUE, JEL.createPattern('[x|y z]?').match(ctx, 'x'));
      assert.equal(JelBoolean.TRUE, JEL.createPattern('[x|y z]?').match(ctx, 'y z'));
      assert.equal(JelBoolean.FALSE, JEL.createPattern('[x|y z]?').match(ctx, 'x y z'));
  
      assert.equal(JelBoolean.TRUE, JEL.createPattern('[x|y|z]? a').match(ctx, 'y a'));
      assert.equal(JelBoolean.TRUE, JEL.createPattern('[x|y|z]? a').match(ctx, 'a'));
      assert.equal(JelBoolean.FALSE, JEL.createPattern('[x|y|z]? a').match(ctx, 'x'));
      assert.equal(JelBoolean.FALSE, JEL.createPattern('[x|y|z]? a').match(ctx, 'y a k'));
    });

    it('should match templates', function() {
        const tpl0 = exec('${`a` => 1}');
        const tpl1 = exec('${`a` => 1, x: `b` => 2, y: `b` => 12, x, y: `b` => 22}');
        const tpl2 = exec('${`a [b [c]?]?` => 3, `a b c` => 4, `d e` => 5, `f {{tpl1}}` => 6}');
        const ctx2 = ctx.plus({tpl0, tpl1, tpl2});

        assert.equal(JelBoolean.TRUE, JEL.createPattern('{{tpl0}}').match(ctx2, 'a'));
        assert.equal(JelBoolean.TRUE, JEL.createPattern('j {{tpl0}}').match(ctx2, 'j a '));
      
        assert.equal(JelBoolean.TRUE, JEL.createPattern('a {{tpl0}}').match(ctx2, 'a a'));
        assert.equal(JelBoolean.TRUE, JEL.createPattern('{{tpl0}} k').match(ctx2, ' a k'));
        assert.equal(JelBoolean.TRUE, JEL.createPattern('{{tpl0}}{{tpl0}}').match(ctx2, 'a a'));
        assert.equal(JelBoolean.TRUE, JEL.createPattern('{{tpl0}} {{tpl0}}').match(ctx2, 'a a'));
        assert.equal(JelBoolean.FALSE, JEL.createPattern('{{tpl0}}').match(ctx2, 'b'));
      
        assert.equal(JelBoolean.TRUE, JEL.createPattern('{{tpl1}}').match(ctx2, 'a'));
        assert.equal(JelBoolean.TRUE, JEL.createPattern('{{tpl1}}').match(ctx2, 'b'));
        assert.equal(JelBoolean.TRUE, JEL.createPattern('{{tpl1.x}}').match(ctx2, 'b'));
        assert.equal(JelBoolean.TRUE, JEL.createPattern('{{tpl1.x.y}}').match(ctx2, 'b'));
        assert.equal(JelBoolean.FALSE, JEL.createPattern('{{tpl1}}').match(ctx2, 'nope'));
        assert.equal(JelBoolean.FALSE, JEL.createPattern('{{tpl1.x}}').match(ctx2, 'a'));
        assert.equal(JelBoolean.FALSE, JEL.createPattern('{{tpl1.x.y.z}}').match(ctx2, 'b'));

        assert.equal(JelBoolean.TRUE, JEL.createPattern('{{t: tpl1 :: t == 12}}').match(ctx2, 'b'));
        assert.equal(JelBoolean.TRUE, JEL.createPattern('{{t: tpl1 :: t == 22}}').match(ctx2, 'b'));
        assert.equal(JelBoolean.FALSE, JEL.createPattern('{{t: tpl1 :: t == 0}}').match(ctx2, 'b'));
        assert.equal(JelBoolean.FALSE, JEL.createPattern('{{t: tpl1.x :: t == 12}}').match(ctx2, 'b'));
        assert.equal(JelBoolean.TRUE, JEL.createPattern('{{t: tpl1.x :: t == 22}}').match(ctx2, 'b'));
        assert.equal(JelBoolean.TRUE, JEL.createPattern('{{test: tpl1 :: test == 1}}').match(ctx2, 'a'));
        assert.equal(JelBoolean.FALSE, JEL.createPattern('{{test: tpl1 :: test > 1}}').match(ctx2, 'a'));
    });

    it('should match regexp templates', function() {
        assert.equal(JelBoolean.TRUE, JEL.createPattern('{{/a+/}}').match(ctx, 'aa'));
        assert.equal(JelBoolean.TRUE, JEL.createPattern('j {{/a+/}}').match(ctx, 'j aaa '));
      
        assert.equal(JelBoolean.TRUE, JEL.createPattern('a {{/a+/}}').match(ctx, 'a a'));
        assert.equal(JelBoolean.TRUE, JEL.createPattern('{{/b/ /c/}} k').match(ctx, 'b c  k'));
        assert.equal(JelBoolean.TRUE, JEL.createPattern('{{/b/}}{{/c/}}k').match(ctx, 'b c k'));
        assert.equal(JelBoolean.TRUE, JEL.createPattern('{{/b/}} {{/c/}} k').match(ctx, 'b c k'));
        assert.equal(JelBoolean.FALSE, JEL.createPattern('{{/ab+/}}').match(ctx, 'a'));
      
        assert.equal(JelBoolean.TRUE, JEL.createPattern('{{a: /a+b*c+/}}').match(ctx, 'aaaacc'));
        assert.equal(JelBoolean.FALSE, JEL.createPattern('{{/a+b*c+/}}').match(ctx, 'aaaab'));
        assert.equal(JelBoolean.FALSE, JEL.createPattern('{{/a/}}').match(ctx, 'ab'));

        assert.equal(JelBoolean.TRUE, JEL.createPattern('{{t: /[0-9]+/ :: t == "12"}}').match(ctx, '12'));
        assert.equal(JelBoolean.FALSE, JEL.createPattern('{{t: /[0-9]+/ :: t == "12"}}').match(ctx, '123'));

        assert.equal(JelBoolean.TRUE, JEL.createPattern('{{t: /([0-9])([0-9])([a-z])/ :: t[0] == "2" && t[1] == "5" && t[2] == "x"}}').match(ctx, '25x'));
        assert.equal(JelBoolean.FALSE, JEL.createPattern('{{t: /([0-9])([0-9])([a-z])/ :: t[0] == "2" && t[1] == "5" && t[2] == "x"}}').match(ctx, '25y'));
        assert.equal(JelBoolean.FALSE, JEL.createPattern('{{t: /([0-9])([0-9])([a-z])/ :: t[0] == "2" && t[1] == "5" && t[2] == "x"}}').match(ctx, '15y'));
        assert.equal(JelBoolean.FALSE, JEL.createPattern('{{t: /([0-9])([0-9])([a-z])/ :: t[0] == "2" && t[1] == "5" && t[2] == "x"}}').match(ctx, 'abc'));

        assert.equal(JelBoolean.TRUE, JEL.createPattern('{{t: /[0-9]/ /[0-9]/ /[a-z]/ :: t[0] == "2" && t[1] == "5" && t[2] == "x"}}').match(ctx, '2 5 x'));
        assert.equal(JelBoolean.FALSE, JEL.createPattern('{{t: /[0-9]/ /[0-9]/ /[a-z]/ :: t[0] == "2" && t[1] == "5" && t[2] == "x"}}').match(ctx, '2 6 x'));

        assert.equal(JelBoolean.TRUE, JEL.createPattern('{{t: /([0-9])(a+)/ /b+/ :: t[0][0] == "7" && t[0][1] == "aa" && t[1] == "bbb"}}').match(ctx, '7aa bbb'));
        assert.equal(JelBoolean.FALSE, JEL.createPattern('{{t: /([0-9])(a+)/ /b+/ :: t[0][0] == "7" && t[0][1] == "aa" && t[1] == "bbb"}}').match(ctx, '7 bbb'));
        assert.equal(JelBoolean.FALSE, JEL.createPattern('{{t: /([0-9])(a+)/ /b+/ :: t[0][0] == "7" && t[0][1] == "aa" && t[1] == "bbb"}}').match(ctx, '7aaa bb'));

        assert.equal(JelBoolean.TRUE, JEL.createPattern('a [{{/b/}} {{/c/}} {{/d/}}]? e').match(ctx, 'a b c d e'));
        assert.equal(JelBoolean.TRUE, JEL.createPattern('a [{{/b/}} {{/c/}} {{/d/}}]? e').match(ctx, 'a e'));
        assert.equal(JelBoolean.FALSE, JEL.createPattern('a [{{/b/}} {{/c/}} {{/d/}}]? e').match(ctx, 'a b e'));
        assert.equal(JelBoolean.FALSE, JEL.createPattern('a [{{/b/}} {{/c/}} {{/d/}}]? e').match(ctx, 'a b c e'));
        assert.equal(JelBoolean.FALSE, JEL.createPattern('a [{{/b/}} {{/c/}} {{/d/}}]? e').match(ctx, 'a b c d'));
        assert.equal(JelBoolean.FALSE, JEL.createPattern('a [{{/b/}} {{/c/}} {{/d/}}]? e').match(ctx, 'a b d e'));
    });
    
    
  });
  
});

